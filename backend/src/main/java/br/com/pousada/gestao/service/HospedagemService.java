package br.com.pousada.gestao.service;

import br.com.pousada.gestao.domain.entity.HistoricoOperacao;
import br.com.pousada.gestao.domain.entity.Hospedagem;
import br.com.pousada.gestao.domain.entity.Quarto;
import br.com.pousada.gestao.domain.entity.Usuario;
import br.com.pousada.gestao.domain.enums.StatusHospedagem;
import br.com.pousada.gestao.domain.enums.StatusQuarto;
import br.com.pousada.gestao.dto.hospedagem.CheckinRequest;
import br.com.pousada.gestao.dto.hospedagem.CheckoutRequest;
import br.com.pousada.gestao.dto.hospedagem.EstornoRequest;
import br.com.pousada.gestao.dto.hospedagem.HospedagemResponse;
import br.com.pousada.gestao.dto.hospedagem.ReservaRequest;
import br.com.pousada.gestao.exception.RecursoNaoEncontradoException;
import br.com.pousada.gestao.exception.RegraNegocioException;
import br.com.pousada.gestao.repository.HistoricoOperacaoRepository;
import br.com.pousada.gestao.repository.HospedagemRepository;
import br.com.pousada.gestao.repository.QuartoRepository;
import br.com.pousada.gestao.repository.UsuarioRepository;
import br.com.pousada.gestao.security.UsuarioPrincipal;
import br.com.pousada.gestao.service.whatsapp.NotificacaoWhatsAppService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;

@Service
public class HospedagemService {

    private final HospedagemRepository hospedagemRepository;
    private final QuartoRepository quartoRepository;
    private final UsuarioRepository usuarioRepository;
    private final HistoricoOperacaoRepository historicoRepository;
    private final NotificacaoWhatsAppService notificacaoWhatsAppService;

    public HospedagemService(HospedagemRepository hospedagemRepository,
                             QuartoRepository quartoRepository,
                             UsuarioRepository usuarioRepository,
                             HistoricoOperacaoRepository historicoRepository,
                             NotificacaoWhatsAppService notificacaoWhatsAppService) {
        this.hospedagemRepository = hospedagemRepository;
        this.quartoRepository = quartoRepository;
        this.usuarioRepository = usuarioRepository;
        this.historicoRepository = historicoRepository;
        this.notificacaoWhatsAppService = notificacaoWhatsAppService;
    }

    @Transactional
    public HospedagemResponse realizarCheckin(CheckinRequest request, UsuarioPrincipal usuarioLogado) {
        Quarto quarto = quartoRepository.findById(request.quartoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Quarto não encontrado."));

        if (!Boolean.TRUE.equals(quarto.getAtivo())) {
            throw new RegraNegocioException("Este quarto está inativo e não aceita check-in.");
        }

        LocalDate dataCheckin = request.dataCheckin() != null ? request.dataCheckin() : LocalDate.now();
        int diarias = request.quantidadeDiarias();
        LocalDate dataCheckoutPrevista = dataCheckin.plusDays(diarias);

        Hospedagem hospedagem;
        if (request.reservaId() != null) {
            hospedagem = hospedagemRepository.findById(request.reservaId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Reserva não encontrada."));
            if (hospedagem.getStatusHospedagem() != StatusHospedagem.RESERVADA) {
                throw new RegraNegocioException("Apenas reservas com status RESERVADA podem ser convertidas em check-in.");
            }
            if (!hospedagem.getQuarto().getId().equals(quarto.getId())) {
                throw new RegraNegocioException("A reserva informada não pertence ao quarto selecionado.");
            }
        } else if (quarto.getStatus() == StatusQuarto.RESERVADO) {
            // Se o quarto estava RESERVADO para hoje, converte a reserva de hoje correspondente
            hospedagem = hospedagemRepository.buscarReservadaPorQuarto(quarto.getId()).orElseGet(Hospedagem::new);
        } else {
            hospedagem = new Hospedagem();
        }

        // 2. Validação de conflito de datas: verifica sobreposição com estadias ativas ou reservas
        validarConflitoDatas(quarto, dataCheckin, dataCheckoutPrevista, hospedagem.getId());

        StatusQuarto statusAnterior = quarto.getStatus();
        if (statusAnterior == StatusQuarto.OCUPADO) {
            throw new RegraNegocioException("Quarto " + quarto.getNumero() + " já está OCUPADO.");
        }
        if (statusAnterior == StatusQuarto.EM_MANUTENCAO) {
            throw new RegraNegocioException("Quarto " + quarto.getNumero() + " está em MANUTENÇÃO e não aceita check-in.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioLogado.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        BigDecimal valorAntecipado = request.valorAntecipado() != null
                ? request.valorAntecipado()
                : (hospedagem.getId() != null && hospedagem.getValorAntecipado() != null
                ? hospedagem.getValorAntecipado()
                : BigDecimal.ZERO);
        BigDecimal valorPagoCheckin = request.valorPagoCheckin();
        BigDecimal somaPagoEntrada = valorAntecipado.add(valorPagoCheckin);

        // Regra: valorTotal = valorPagoCheckin quando não informado separadamente (somado a eventual sinal antecipado)
        BigDecimal valorTotal = request.valorTotal() != null ? request.valorTotal() : somaPagoEntrada;

        if (somaPagoEntrada.compareTo(valorTotal) > 0) {
            throw new RegraNegocioException("A soma do sinal antecipado e do valor pago no check-in não pode superar o valor total.");
        }

        hospedagem.setQuarto(quarto);
        hospedagem.setUsuarioRegistro(usuario);
        hospedagem.setNomeHospede(request.nomeHospede().trim());
        hospedagem.setQuantidadePessoas(request.quantidadePessoas());
        hospedagem.setDataCheckin(dataCheckin);
        hospedagem.setQuantidadeDiarias(diarias);
        hospedagem.setDataCheckoutPrevista(dataCheckoutPrevista);
        hospedagem.setStatusHospedagem(StatusHospedagem.ATIVA);
        hospedagem.setValorAntecipado(valorAntecipado);
        hospedagem.setValorPagoCheckin(valorPagoCheckin);
        hospedagem.setValorPagoCheckout(BigDecimal.ZERO);
        hospedagem.setValorTotal(valorTotal);

        Hospedagem salva = hospedagemRepository.save(hospedagem);

        quarto.setStatus(StatusQuarto.OCUPADO);
        if (request.observacaoQuarto() != null && !request.observacaoQuarto().isBlank()) {
            quarto.setObservacaoAtual(request.observacaoQuarto().trim());
        }
        quartoRepository.save(quarto);

        registrarHistorico(quarto, salva, usuario, "CHECKIN", statusAnterior, StatusQuarto.OCUPADO,
                "Check-in de " + salva.getNomeHospede() + " (" + diarias + " diária(s)).");

        var dadosWhatsApp = new NotificacaoWhatsAppService.DadosCheckinWhatsApp(
                quarto.getNumero(),
                salva.getNomeHospede(),
                salva.getQuantidadePessoas(),
                salva.getDataCheckin(),
                salva.getQuantidadeDiarias(),
                salva.getDataCheckoutPrevista(),
                salva.getValorTotal(),
                salva.getTotalRecebido(),
                salva.getSaldoAReceber(),
                usuario.getNome()
        );
        executarAposCommit(() -> notificacaoWhatsAppService.notificarCheckin(dadosWhatsApp));

        return toResponse(salva);
    }

    @Transactional
    public HospedagemResponse registrarReserva(ReservaRequest request, UsuarioPrincipal usuarioLogado) {
        Quarto quarto = quartoRepository.findById(request.quartoId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Quarto não encontrado."));

        if (!Boolean.TRUE.equals(quarto.getAtivo())) {
            throw new RegraNegocioException("Este quarto está inativo e não aceita reservas.");
        }

        LocalDate dataCheckin = request.dataCheckin();
        int diarias = request.quantidadeDiarias();
        LocalDate dataCheckoutPrevista = dataCheckin.plusDays(diarias);

        // 2. Validação de conflito de datas: verifica sobreposição de datas no mesmo quarto
        validarConflitoDatas(quarto, dataCheckin, dataCheckoutPrevista, null);

        LocalDate hoje = LocalDate.now();
        // Se a reserva for para HOJE e o quarto não estiver DISPONÍVEL, bloqueia
        if (!dataCheckin.isAfter(hoje) && quarto.getStatus() != StatusQuarto.DISPONIVEL) {
            throw new RegraNegocioException("Quarto " + quarto.getNumero() + " precisa estar DISPONÍVEL para reserva na data de hoje.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioLogado.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        BigDecimal valorAntecipado = request.valorAntecipado() != null ? request.valorAntecipado() : BigDecimal.ZERO;
        if (valorAntecipado.compareTo(request.valorTotal()) > 0) {
            throw new RegraNegocioException("O sinal antecipado não pode superar o valor total da reserva.");
        }

        Hospedagem reserva = new Hospedagem();
        reserva.setQuarto(quarto);
        reserva.setUsuarioRegistro(usuario);
        reserva.setNomeHospede(request.nomeHospede().trim());
        reserva.setQuantidadePessoas(request.quantidadePessoas());
        reserva.setDataCheckin(dataCheckin);
        reserva.setQuantidadeDiarias(diarias);
        reserva.setDataCheckoutPrevista(dataCheckoutPrevista);
        reserva.setStatusHospedagem(StatusHospedagem.RESERVADA);
        reserva.setValorTotal(request.valorTotal());
        reserva.setValorAntecipado(valorAntecipado);
        reserva.setValorPagoCheckin(BigDecimal.ZERO);
        reserva.setValorPagoCheckout(BigDecimal.ZERO);

        Hospedagem salva = hospedagemRepository.save(reserva);

        StatusQuarto statusAnterior = quarto.getStatus();

        // 1. Estado físico do quarto hoje:
        // Agendar uma reserva futura (dataCheckin > hoje) NÃO deixa o quarto como RESERVADO hoje!
        // O quarto só assume RESERVADO hoje se a data de chegada for hoje (ou anterior).
        if (!dataCheckin.isAfter(hoje) && quarto.getStatus() == StatusQuarto.DISPONIVEL) {
            quarto.setStatus(StatusQuarto.RESERVADO);
            if (request.observacaoQuarto() != null && !request.observacaoQuarto().isBlank()) {
                quarto.setObservacaoAtual(request.observacaoQuarto().trim());
            } else {
                quarto.setObservacaoAtual("Reservado para " + salva.getNomeHospede());
            }
            quartoRepository.save(quarto);
        }

        registrarHistorico(quarto, salva, usuario, "RESERVA", statusAnterior, quarto.getStatus(),
                "Reserva registrada para " + salva.getNomeHospede() + " (" + dataCheckin + " a " + dataCheckoutPrevista + ").");

        return toResponse(salva);
    }

    @Transactional(readOnly = true)
    public List<HospedagemResponse> listarReservasAtivas() {
        return hospedagemRepository.buscarTodasPorStatuses(Set.of(StatusHospedagem.RESERVADA))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public HospedagemResponse cancelarReserva(Long hospedagemId, UsuarioPrincipal usuarioLogado) {
        Hospedagem hospedagem = hospedagemRepository.findById(hospedagemId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Reserva não encontrada com ID " + hospedagemId + "."));

        if (hospedagem.getStatusHospedagem() != StatusHospedagem.RESERVADA) {
            throw new RegraNegocioException("Apenas reservas com status RESERVADA podem ser canceladas.");
        }

        Quarto quarto = hospedagem.getQuarto();
        Usuario usuario = usuarioRepository.findById(usuarioLogado.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        hospedagem.setStatusHospedagem(StatusHospedagem.CANCELADA);
        Hospedagem salva = hospedagemRepository.save(hospedagem);

        // Se o quarto estava com status RESERVADO hoje, verifica se ainda existe outra reserva para hoje
        if (quarto.getStatus() == StatusQuarto.RESERVADO) {
            LocalDate hoje = LocalDate.now();
            List<Hospedagem> outras = hospedagemRepository.buscarPorQuartoEStatuses(
                    quarto.getId(), Set.of(StatusHospedagem.RESERVADA)
            );
            boolean temOutraHoje = outras.stream().anyMatch(r ->
                    !r.getId().equals(salva.getId()) &&
                    !r.getDataCheckin().isAfter(hoje) &&
                    r.getDataCheckoutPrevista().isAfter(hoje)
            );
            if (!temOutraHoje) {
                quarto.setStatus(StatusQuarto.DISPONIVEL);
                quarto.setObservacaoAtual(null);
                quartoRepository.save(quarto);
            }
        }

        registrarHistorico(quarto, salva, usuario, "CANCELAMENTO_RESERVA", quarto.getStatus(), quarto.getStatus(),
                "Reserva de " + salva.getNomeHospede() + " cancelada.");

        return toResponse(salva);
    }

    @Transactional
    public HospedagemResponse realizarCheckout(Long quartoId, CheckoutRequest request, UsuarioPrincipal usuarioLogado) {
        Quarto quarto = quartoRepository.findById(quartoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Quarto não encontrado."));

        if (quarto.getStatus() != StatusQuarto.OCUPADO) {
            throw new RegraNegocioException("Somente quartos com status OCUPADO permitem check-out.");
        }

        Hospedagem hospedagem = hospedagemRepository.buscarAtivaPorQuarto(quartoId)
                .orElseThrow(() -> new RegraNegocioException("Nenhuma hospedagem ativa encontrada para o quarto " + quarto.getNumero() + "."));

        Usuario usuario = usuarioRepository.findById(usuarioLogado.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        BigDecimal pagoCheckout = (request != null && request.valorPagoCheckout() != null)
                ? request.valorPagoCheckout()
                : BigDecimal.ZERO;

        if (pagoCheckout.compareTo(hospedagem.getSaldoAReceber()) > 0) {
            throw new RegraNegocioException("O valor pago no check-out não pode exceder o saldo a receber.");
        }

        LocalDateTime agora = LocalDateTime.now();
        hospedagem.setDataCheckoutReal(agora);
        hospedagem.setValorPagoCheckout(pagoCheckout);
        hospedagem.setStatusHospedagem(StatusHospedagem.FINALIZADA);
        Hospedagem salva = hospedagemRepository.save(hospedagem);

        String obsLimpeza = (request != null && request.observacaoLimpeza() != null && !request.observacaoLimpeza().isBlank())
                ? request.observacaoLimpeza().trim()
                : null;
        quarto.setStatus(StatusQuarto.AGUARDANDO_LIMPEZA);
        quarto.setObservacaoAtual(obsLimpeza);
        quartoRepository.save(quarto);

        registrarHistorico(quarto, salva, usuario, "CHECKOUT", StatusQuarto.OCUPADO, StatusQuarto.AGUARDANDO_LIMPEZA,
                "Check-out de " + salva.getNomeHospede() + ".");

        var dadosCheckout = new NotificacaoWhatsAppService.DadosCheckoutWhatsApp(
                quarto.getNumero(),
                salva.getNomeHospede(),
                agora,
                pagoCheckout,
                obsLimpeza,
                usuario.getNome()
        );
        executarAposCommit(() -> notificacaoWhatsAppService.notificarCheckoutPedidoLimpeza(dadosCheckout));

        return toResponse(salva);
    }

    @Transactional
    public HospedagemResponse estornarCheckin(Long hospedagemId, EstornoRequest request, UsuarioPrincipal usuarioLogado) {
        Hospedagem hospedagem = hospedagemRepository.findById(hospedagemId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Hospedagem não encontrada."));

        if (hospedagem.getStatusHospedagem() != StatusHospedagem.ATIVA) {
            throw new RegraNegocioException("Apenas hospedagens ATIVAS podem ser estornadas.");
        }

        Quarto quarto = hospedagem.getQuarto();
        Usuario gerente = usuarioRepository.findById(usuarioLogado.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário gerente não encontrado."));

        String motivo = request.motivo().trim();
        StatusQuarto statusAnterior = quarto.getStatus();

        hospedagem.setStatusHospedagem(StatusHospedagem.ESTORNADA);
        hospedagem.setUsuarioEstorno(gerente);
        hospedagem.setMotivoEstorno(motivo);
        Hospedagem salva = hospedagemRepository.save(hospedagem);

        quarto.setStatus(StatusQuarto.DISPONIVEL);
        quarto.setObservacaoAtual(null);
        quartoRepository.save(quarto);

        registrarHistorico(quarto, salva, gerente, "ESTORNO", statusAnterior, StatusQuarto.DISPONIVEL,
                "Check-in estornado. Motivo: " + motivo);

        String numeroQuarto = quarto.getNumero();
        String nomeHospede = salva.getNomeHospede();
        String nomeGerente = gerente.getNome();
        executarAposCommit(() -> notificacaoWhatsAppService.notificarEstornoCheckin(numeroQuarto, nomeHospede, motivo, nomeGerente));

        return toResponse(salva);
    }

    private void validarConflitoDatas(Quarto quarto, LocalDate novaDataCheckin, LocalDate novaDataCheckoutPrevista, Long ignorarHospedagemId) {
        List<Hospedagem> existentes = hospedagemRepository.buscarPorQuartoEStatuses(
                quarto.getId(), Set.of(StatusHospedagem.ATIVA, StatusHospedagem.RESERVADA)
        );

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Hospedagem h : existentes) {
            if (ignorarHospedagemId != null && h.getId().equals(ignorarHospedagemId)) {
                continue;
            }

            LocalDate existenteCheckin = h.getDataCheckin();
            LocalDate existenteCheckout = h.getDataCheckoutPrevista();

            // Sobreposição de intervalos: novaDataCheckin < existente.dataCheckoutPrevista && novaDataCheckoutPrevista > existente.dataCheckin
            if (novaDataCheckin.isBefore(existenteCheckout) && novaDataCheckoutPrevista.isAfter(existenteCheckin)) {
                String tipo = h.getStatusHospedagem() == StatusHospedagem.RESERVADA ? "uma reserva agendada" : "uma hospedagem ativa";
                throw new RegraNegocioException(String.format(
                        "Conflito de datas no Quarto %s: já existe %s para %s no período de %s a %s.",
                        quarto.getNumero(),
                        tipo,
                        h.getNomeHospede(),
                        existenteCheckin.format(fmt),
                        existenteCheckout.format(fmt)
                ));
            }
        }
    }

    private HospedagemResponse toResponse(Hospedagem h) {
        return new HospedagemResponse(
                h.getId(),
                h.getQuarto().getId(),
                h.getQuarto().getNumero(),
                h.getNomeHospede(),
                h.getQuantidadePessoas(),
                h.getDataCheckin(),
                h.getQuantidadeDiarias(),
                h.getDataCheckoutPrevista(),
                h.getDataCheckoutReal(),
                h.getStatusHospedagem(),
                h.getValorTotal(),
                h.getValorAntecipado(),
                h.getValorPagoCheckin(),
                h.getValorPagoCheckout(),
                h.getTotalRecebido(),
                h.getSaldoAReceber(),
                h.getUsuarioRegistro() != null ? h.getUsuarioRegistro().getNome() : null
        );
    }

    private void registrarHistorico(Quarto quarto,
                                    Hospedagem hospedagem,
                                    Usuario usuario,
                                    String tipo,
                                    StatusQuarto statusAnterior,
                                    StatusQuarto statusNovo,
                                    String detalhes) {
        HistoricoOperacao hist = new HistoricoOperacao();
        hist.setQuarto(quarto);
        hist.setHospedagem(hospedagem);
        hist.setUsuario(usuario);
        hist.setTipoOperacao(tipo);
        hist.setStatusAnterior(statusAnterior);
        hist.setStatusNovo(statusNovo);
        hist.setDetalhes(detalhes);
        historicoRepository.save(hist);
    }

    private void executarAposCommit(Runnable acao) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    acao.run();
                }
            });
        } else {
            acao.run();
        }
    }
}
