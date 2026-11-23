package br.com.pousada.gestao.service;

import br.com.pousada.gestao.domain.entity.HistoricoOperacao;
import br.com.pousada.gestao.domain.entity.Hospedagem;
import br.com.pousada.gestao.domain.entity.Quarto;
import br.com.pousada.gestao.domain.entity.Usuario;
import br.com.pousada.gestao.domain.enums.PerfilUsuario;
import br.com.pousada.gestao.domain.enums.StatusHospedagem;
import br.com.pousada.gestao.domain.enums.StatusQuarto;
import br.com.pousada.gestao.dto.quarto.AlterarStatusQuartoRequest;
import br.com.pousada.gestao.dto.quarto.HospedagemResumoMapaDTO;
import br.com.pousada.gestao.dto.quarto.ObservacaoRequest;
import br.com.pousada.gestao.dto.quarto.QuartoMapaDTO;
import br.com.pousada.gestao.dto.quarto.QuartoRequest;
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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class QuartoService {

    private final QuartoRepository quartoRepository;
    private final HospedagemRepository hospedagemRepository;
    private final UsuarioRepository usuarioRepository;
    private final HistoricoOperacaoRepository historicoRepository;
    private final NotificacaoWhatsAppService notificacaoWhatsAppService;

    public QuartoService(QuartoRepository quartoRepository,
                         HospedagemRepository hospedagemRepository,
                         UsuarioRepository usuarioRepository,
                         HistoricoOperacaoRepository historicoRepository,
                         NotificacaoWhatsAppService notificacaoWhatsAppService) {
        this.quartoRepository = quartoRepository;
        this.hospedagemRepository = hospedagemRepository;
        this.usuarioRepository = usuarioRepository;
        this.historicoRepository = historicoRepository;
        this.notificacaoWhatsAppService = notificacaoWhatsAppService;
    }

    @Transactional
    public List<QuartoMapaDTO> listarMapa(boolean incluirInativos, UsuarioPrincipal usuarioLogado) {
        boolean mostrarTodos = incluirInativos && usuarioLogado.getPerfil() == PerfilUsuario.GERENTE;
        List<Quarto> quartos = mostrarTodos
                ? quartoRepository.findAllByOrderByNumeroAsc()
                : quartoRepository.findByAtivoTrueOrderByNumeroAsc();

        List<Hospedagem> abertas = hospedagemRepository.buscarTodasPorStatuses(
                Set.of(StatusHospedagem.ATIVA, StatusHospedagem.RESERVADA)
        );

        LocalDate hoje = LocalDate.now();

        Map<Long, Hospedagem> ativaPorQuarto = new HashMap<>();
        Map<Long, List<Hospedagem>> reservasPorQuarto = new HashMap<>();

        for (Hospedagem h : abertas) {
            Long qId = h.getQuarto().getId();
            if (h.getStatusHospedagem() == StatusHospedagem.ATIVA) {
                ativaPorQuarto.put(qId, h);
            } else if (h.getStatusHospedagem() == StatusHospedagem.RESERVADA) {
                reservasPorQuarto.computeIfAbsent(qId, k -> new ArrayList<>()).add(h);
            }
        }

        return quartos.stream()
                .map(q -> {
                    Hospedagem ativa = ativaPorQuarto.get(q.getId());
                    List<Hospedagem> reservas = reservasPorQuarto.getOrDefault(q.getId(), Collections.emptyList());

                    Hospedagem hospedagemAtual = null;
                    Hospedagem proximaReserva = null;

                    if (ativa != null) {
                        hospedagemAtual = ativa;
                        proximaReserva = reservas.stream()
                                .filter(r -> r.getDataCheckoutPrevista().isAfter(hoje))
                                .min(Comparator.comparing(Hospedagem::getDataCheckin))
                                .orElse(null);
                    } else {
                        // Procura reserva cobrindo o dia de hoje
                        Hospedagem reservaHoje = reservas.stream()
                                .filter(r -> !r.getDataCheckin().isAfter(hoje) && r.getDataCheckoutPrevista().isAfter(hoje))
                                .findFirst()
                                .orElse(null);

                        if (reservaHoje != null) {
                            hospedagemAtual = reservaHoje;
                            // Se o quarto estava DISPONÍVEL, assume RESERVADO automaticamente no dia da chegada
                            if (q.getStatus() == StatusQuarto.DISPONIVEL) {
                                q.setStatus(StatusQuarto.RESERVADO);
                                if (q.getObservacaoAtual() == null || q.getObservacaoAtual().isBlank()) {
                                    q.setObservacaoAtual("Reservado para " + reservaHoje.getNomeHospede());
                                }
                                quartoRepository.save(q);
                            }
                            proximaReserva = reservas.stream()
                                    .filter(r -> !r.getId().equals(reservaHoje.getId()) && r.getDataCheckin().isAfter(hoje))
                                    .min(Comparator.comparing(Hospedagem::getDataCheckin))
                                    .orElse(null);
                        } else {
                            // Não há reserva para hoje. Se o quarto estava como RESERVADO, restaura para DISPONIVEL
                            if (q.getStatus() == StatusQuarto.RESERVADO) {
                                q.setStatus(StatusQuarto.DISPONIVEL);
                                q.setObservacaoAtual(null);
                                quartoRepository.save(q);
                            }
                            // Item 1: exibe apenas reservas com dataCheckin estritamente futuras (a mais próxima)
                            proximaReserva = reservas.stream()
                                    .filter(r -> r.getDataCheckin().isAfter(hoje))
                                    .min(Comparator.comparing(Hospedagem::getDataCheckin))
                                    .orElse(null);
                        }
                    }

                    return toMapaDTO(q, hospedagemAtual, proximaReserva);
                })
                .toList();
    }

    @Transactional
    public QuartoMapaDTO criarQuarto(QuartoRequest request, UsuarioPrincipal usuarioLogado) {
        String numero = request.numero().trim();
        if (quartoRepository.existsByNumero(numero)) {
            throw new RegraNegocioException("Já existe um quarto cadastrado com o número " + numero + ".");
        }

        Quarto quarto = new Quarto();
        quarto.setNumero(numero);
        quarto.setDescricao(limparTexto(request.descricao()));
        quarto.setCapacidadeMaxima(request.capacidadeMaxima() != null ? request.capacidadeMaxima() : 4);
        quarto.setDiariaPadrao(request.diariaPadrao());
        quarto.setStatus(StatusQuarto.DISPONIVEL);
        quarto.setAtivo(request.ativo() != null ? request.ativo() : true);
        quarto.setDataCriacao(request.dataCriacao() != null ? request.dataCriacao() : LocalDate.now());

        Quarto salvo = quartoRepository.save(quarto);
        registrarHistorico(salvo, null, usuarioLogado.getId(), "CADASTRO_QUARTO", null, salvo.getStatus(),
                "Quarto " + salvo.getNumero() + " cadastrado.");

        return toMapaDTO(salvo, null, null);
    }

    @Transactional
    public QuartoMapaDTO atualizarQuarto(Long id, QuartoRequest request, UsuarioPrincipal usuarioLogado) {
        Quarto quarto = buscarQuarto(id);
        String numero = request.numero().trim();
        if (quartoRepository.existsByNumeroAndIdNot(numero, id)) {
            throw new RegraNegocioException("Já existe outro quarto cadastrado com o número " + numero + ".");
        }

        if (Boolean.FALSE.equals(request.ativo()) && quarto.getStatus() == StatusQuarto.OCUPADO) {
            throw new RegraNegocioException("Não é possível desativar um quarto que está ocupado.");
        }

        quarto.setNumero(numero);
        quarto.setDescricao(limparTexto(request.descricao()));
        if (request.capacidadeMaxima() != null) {
            quarto.setCapacidadeMaxima(request.capacidadeMaxima());
        }
        quarto.setDiariaPadrao(request.diariaPadrao());
        if (request.ativo() != null) {
            quarto.setAtivo(request.ativo());
        }
        if (request.dataCriacao() != null) {
            quarto.setDataCriacao(request.dataCriacao());
        }

        Quarto salvo = quartoRepository.save(quarto);
        registrarHistorico(salvo, null, usuarioLogado.getId(), "EDICAO_QUARTO", salvo.getStatus(), salvo.getStatus(),
                "Dados cadastrais do quarto " + salvo.getNumero() + " atualizados.");

        Hospedagem hospedagemAtual = buscarHospedagemExibicao(salvo);
        Hospedagem proximaReserva = buscarProximaReserva(salvo, hospedagemAtual != null ? hospedagemAtual.getId() : null);
        return toMapaDTO(salvo, hospedagemAtual, proximaReserva);
    }

    @Transactional
    public QuartoMapaDTO alterarStatus(Long id, AlterarStatusQuartoRequest request, UsuarioPrincipal usuarioLogado) {
        Quarto quarto = buscarQuarto(id);
        if (!Boolean.TRUE.equals(quarto.getAtivo())) {
            throw new RegraNegocioException("Quarto inativo não pode alterar status operacional.");
        }

        StatusQuarto statusAnterior = quarto.getStatus();
        StatusQuarto novoStatus = request.novoStatus();

        if (statusAnterior == novoStatus) {
            Hospedagem atual = buscarHospedagemExibicao(quarto);
            Hospedagem prox = buscarProximaReserva(quarto, atual != null ? atual.getId() : null);
            return toMapaDTO(quarto, atual, prox);
        }

        if (statusAnterior == StatusQuarto.OCUPADO) {
            throw new RegraNegocioException("Quarto ocupado exige Check-out ou Estorno antes de mudar de status.");
        }
        if (novoStatus == StatusQuarto.OCUPADO) {
            throw new RegraNegocioException("Para ocupar um quarto, realize o Check-in.");
        }

        validarTransicaoStatus(statusAnterior, novoStatus);

        String observacaoLimpa = limparTexto(request.observacaoAtual());
        if (novoStatus == StatusQuarto.EM_MANUTENCAO) {
            String obsEfetiva = observacaoLimpa != null ? observacaoLimpa : limparTexto(quarto.getObservacaoAtual());
            if (obsEfetiva == null || obsEfetiva.isBlank()) {
                throw new RegraNegocioException("Informe obrigatoriamente o motivo na observação ao colocar o quarto em manutenção.");
            }
            quarto.setObservacaoAtual(obsEfetiva);
        } else if (novoStatus == StatusQuarto.DISPONIVEL) {
            quarto.setObservacaoAtual(observacaoLimpa);
        } else if (observacaoLimpa != null) {
            quarto.setObservacaoAtual(observacaoLimpa);
        }

        // Caso libere um quarto RESERVADO para DISPONIVEL, cancela eventual reserva vinculada de hoje
        if (statusAnterior == StatusQuarto.RESERVADO && novoStatus == StatusQuarto.DISPONIVEL) {
            hospedagemRepository.buscarReservadaPorQuarto(quarto.getId()).ifPresent(reserva -> {
                reserva.setStatusHospedagem(StatusHospedagem.CANCELADA);
                hospedagemRepository.save(reserva);
            });
        }

        quarto.setStatus(novoStatus);
        Quarto salvo = quartoRepository.save(quarto);

        registrarHistorico(salvo, null, usuarioLogado.getId(), "MUDANCA_STATUS", statusAnterior, novoStatus,
                salvo.getObservacaoAtual());

        String msgWhatsApp = dispararNotificacaoTransicao(statusAnterior, novoStatus, salvo.getNumero(), salvo.getObservacaoAtual(), usuarioLogado.getNome());

        Hospedagem hospedagemAtual = buscarHospedagemExibicao(salvo);
        Hospedagem proximaReserva = buscarProximaReserva(salvo, hospedagemAtual != null ? hospedagemAtual.getId() : null);
        return toMapaDTO(salvo, hospedagemAtual, proximaReserva, msgWhatsApp);
    }

    @Transactional
    public QuartoMapaDTO atualizarObservacao(Long id, ObservacaoRequest request, UsuarioPrincipal usuarioLogado) {
        Quarto quarto = buscarQuarto(id);
        String novaObs = limparTexto(request.observacaoAtual());

        if (quarto.getStatus() == StatusQuarto.EM_MANUTENCAO && (novaObs == null || novaObs.isBlank())) {
            throw new RegraNegocioException("Quarto em manutenção deve manter uma observação explicando o reparo.");
        }

        quarto.setObservacaoAtual(novaObs);
        Quarto salvo = quartoRepository.save(quarto);

        registrarHistorico(salvo, null, usuarioLogado.getId(), "OBSERVACAO", salvo.getStatus(), salvo.getStatus(), novaObs);
        Hospedagem atual = buscarHospedagemExibicao(salvo);
        Hospedagem prox = buscarProximaReserva(salvo, atual != null ? atual.getId() : null);
        return toMapaDTO(salvo, atual, prox);
    }

    public QuartoMapaDTO toMapaDTO(Quarto q, Hospedagem hAtual, Hospedagem hProx) {
        return toMapaDTO(q, hAtual, hProx, null);
    }

    public QuartoMapaDTO toMapaDTO(Quarto q, Hospedagem hAtual, Hospedagem hProx, String msgWhatsApp) {
        return new QuartoMapaDTO(
                q.getId(),
                q.getNumero(),
                q.getDescricao(),
                q.getCapacidadeMaxima(),
                q.getDiariaPadrao(),
                q.getStatus(),
                q.getObservacaoAtual(),
                q.getAtivo(),
                q.getDataCriacao(),
                q.getAtualizadoEm(),
                toResumo(hAtual),
                toResumo(hProx),
                msgWhatsApp
        );
    }

    private HospedagemResumoMapaDTO toResumo(Hospedagem h) {
        if (h == null) return null;
        return new HospedagemResumoMapaDTO(
                h.getId(),
                h.getNomeHospede(),
                h.getQuantidadePessoas(),
                h.getDataCheckin(),
                h.getQuantidadeDiarias(),
                h.getDataCheckoutPrevista(),
                h.getStatusHospedagem(),
                h.getValorTotal(),
                h.getValorAntecipado(),
                h.getValorPagoCheckin(),
                h.getSaldoAReceber(),
                h.getUsuarioRegistro() != null ? h.getUsuarioRegistro().getNome() : null
        );
    }

    private void validarTransicaoStatus(StatusQuarto atual, StatusQuarto destino) {
        boolean valida = switch (atual) {
            case DISPONIVEL -> destino == StatusQuarto.RESERVADO
                    || destino == StatusQuarto.EM_MANUTENCAO
                    || destino == StatusQuarto.AGUARDANDO_LIMPEZA;
            case RESERVADO -> destino == StatusQuarto.DISPONIVEL
                    || destino == StatusQuarto.EM_MANUTENCAO;
            case AGUARDANDO_LIMPEZA -> destino == StatusQuarto.EM_LIMPEZA
                    || destino == StatusQuarto.DISPONIVEL
                    || destino == StatusQuarto.EM_MANUTENCAO;
            case EM_LIMPEZA -> destino == StatusQuarto.DISPONIVEL
                    || destino == StatusQuarto.EM_MANUTENCAO
                    || destino == StatusQuarto.AGUARDANDO_LIMPEZA;
            case EM_MANUTENCAO -> destino == StatusQuarto.DISPONIVEL
                    || destino == StatusQuarto.AGUARDANDO_LIMPEZA;
            case OCUPADO -> false;
        };

        if (!valida) {
            throw new RegraNegocioException("Transição inválida de " + atual + " para " + destino + ".");
        }
    }

    private String dispararNotificacaoTransicao(StatusQuarto anterior,
                                                StatusQuarto novo,
                                                String numeroQuarto,
                                                String observacao,
                                                String responsavel) {
        if (anterior == StatusQuarto.AGUARDANDO_LIMPEZA && novo == StatusQuarto.EM_LIMPEZA) {
            return null;
        }

        if (novo == StatusQuarto.EM_MANUTENCAO) {
            return notificacaoWhatsAppService.notificarEntradaManutencao(numeroQuarto, observacao, responsavel);
        } else if (novo == StatusQuarto.DISPONIVEL
                && (anterior == StatusQuarto.AGUARDANDO_LIMPEZA
                || anterior == StatusQuarto.EM_LIMPEZA
                || anterior == StatusQuarto.EM_MANUTENCAO)) {
            return notificacaoWhatsAppService.notificarQuartoDisponivel(numeroQuarto, responsavel);
        }
        return null;
    }

    private Hospedagem buscarHospedagemExibicao(Quarto quarto) {
        if (quarto.getStatus() == StatusQuarto.OCUPADO) {
            return hospedagemRepository.buscarAtivaPorQuarto(quarto.getId()).orElse(null);
        }
        if (quarto.getStatus() == StatusQuarto.RESERVADO) {
            LocalDate hoje = LocalDate.now();
            List<Hospedagem> reservas = hospedagemRepository.buscarPorQuartoEStatuses(
                    quarto.getId(), Set.of(StatusHospedagem.RESERVADA)
            );
            return reservas.stream()
                    .filter(r -> !r.getDataCheckin().isAfter(hoje) && r.getDataCheckoutPrevista().isAfter(hoje))
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }

    private Hospedagem buscarProximaReserva(Quarto quarto, Long idHospedagemAtual) {
        LocalDate hoje = LocalDate.now();
        List<Hospedagem> reservas = hospedagemRepository.buscarPorQuartoEStatuses(
                quarto.getId(), Set.of(StatusHospedagem.RESERVADA)
        );
        // Item 1: considera apenas reservas com dataCheckin estritamente futura
        return reservas.stream()
                .filter(r -> (idHospedagemAtual == null || !r.getId().equals(idHospedagemAtual))
                        && r.getDataCheckin().isAfter(hoje))
                .min(Comparator.comparing(Hospedagem::getDataCheckin))
                .orElse(null);
    }

    private Quarto buscarQuarto(Long id) {
        return quartoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Quarto não encontrado com ID " + id + "."));
    }

    private void registrarHistorico(Quarto quarto,
                                    Hospedagem hospedagem,
                                    Long usuarioId,
                                    String tipo,
                                    StatusQuarto statusAnterior,
                                    StatusQuarto statusNovo,
                                    String detalhes) {
        Usuario usuario = usuarioRepository.getReferenceById(usuarioId);
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

    private String limparTexto(String str) {
        if (str == null) {
            return null;
        }
        String t = str.trim();
        return t.isEmpty() ? null : t;
    }
}
