package br.com.pousada.gestao.service;

import br.com.pousada.gestao.domain.entity.Hospedagem;
import br.com.pousada.gestao.domain.entity.Quarto;
import br.com.pousada.gestao.domain.enums.StatusHospedagem;
import br.com.pousada.gestao.dto.relatorio.AuditoriaItemDTO;
import br.com.pousada.gestao.dto.relatorio.DesempenhoQuartoDTO;
import br.com.pousada.gestao.dto.relatorio.DisponibilidadeDiariaDTO;
import br.com.pousada.gestao.dto.relatorio.RelatorioVacanciaDTO;
import br.com.pousada.gestao.exception.RegraNegocioException;
import br.com.pousada.gestao.repository.HistoricoOperacaoRepository;
import br.com.pousada.gestao.repository.HospedagemRepository;
import br.com.pousada.gestao.repository.QuartoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RelatorioVacanciaService {

    private static final Set<StatusHospedagem> STATUS_VALIDOS_RELATORIO = Set.of(
            StatusHospedagem.ATIVA,
            StatusHospedagem.FINALIZADA,
            StatusHospedagem.RESERVADA
    );

    private static final BigDecimal CEM = new BigDecimal("100");

    private final QuartoRepository quartoRepository;
    private final HospedagemRepository hospedagemRepository;
    private final HistoricoOperacaoRepository historicoRepository;

    public RelatorioVacanciaService(QuartoRepository quartoRepository,
                                    HospedagemRepository hospedagemRepository,
                                    HistoricoOperacaoRepository historicoRepository) {
        this.quartoRepository = quartoRepository;
        this.hospedagemRepository = hospedagemRepository;
        this.historicoRepository = historicoRepository;
    }

    @Transactional(readOnly = true)
    public RelatorioVacanciaDTO gerarRelatorio(LocalDate dataInicio, LocalDate dataFim) {
        if (dataInicio == null || dataFim == null) {
            throw new RegraNegocioException("Informe dataInicio e dataFim.");
        }
        if (dataFim.isBefore(dataInicio)) {
            throw new RegraNegocioException("A data final não pode ser anterior à data inicial.");
        }
        long quantidadeDiasPeriodo = ChronoUnit.DAYS.between(dataInicio, dataFim) + 1;
        if (quantidadeDiasPeriodo > 366) {
            throw new RegraNegocioException("O intervalo máximo permitido para o relatório é de 366 dias.");
        }

        List<Quarto> quartosAtivos = quartoRepository.findByAtivoTrueOrderByNumeroAsc();
        Map<Long, Quarto> mapaQuartos = new LinkedHashMap<>();
        Map<Long, Set<LocalDate>> datasOcupadasPorQuarto = new HashMap<>();
        Map<Long, BigDecimal> recebidoPorQuarto = new HashMap<>();
        Map<Long, BigDecimal> aReceberPorQuarto = new HashMap<>();

        for (Quarto q : quartosAtivos) {
            mapaQuartos.put(q.getId(), q);
            datasOcupadasPorQuarto.put(q.getId(), new HashSet<>());
            recebidoPorQuarto.put(q.getId(), BigDecimal.ZERO);
            aReceberPorQuarto.put(q.getId(), BigDecimal.ZERO);
        }

        // Busca apenas ATIVA, FINALIZADA e RESERVADA (ignorando ESTORNADA e CANCELADA)
        List<Hospedagem> hospedagens = hospedagemRepository.buscarParaRelatorioAteDataFim(
                STATUS_VALIDOS_RELATORIO,
                dataFim
        );

        for (Hospedagem h : hospedagens) {
            Quarto q = mapaQuartos.get(h.getQuarto().getId());
            if (q == null) {
                continue;
            }

            LocalDate inicioElegivelQuarto = dataInicio.isAfter(q.getDataCriacao()) ? dataInicio : q.getDataCriacao();
            if (inicioElegivelQuarto.isAfter(dataFim)) {
                continue;
            }

            LocalDate dataCheckoutEfetiva = calcularDataCheckoutEfetiva(h);
            long totalNoitesEstadia = ChronoUnit.DAYS.between(h.getDataCheckin(), dataCheckoutEfetiva);
            if (totalNoitesEstadia <= 0) {
                continue;
            }

            LocalDate ultimoPernoiteEstadia = dataCheckoutEfetiva.minusDays(1);
            LocalDate iniIntersecao = h.getDataCheckin().isAfter(inicioElegivelQuarto)
                    ? h.getDataCheckin()
                    : inicioElegivelQuarto;
            LocalDate fimIntersecao = ultimoPernoiteEstadia.isBefore(dataFim)
                    ? ultimoPernoiteEstadia
                    : dataFim;

            if (fimIntersecao.isBefore(iniIntersecao)) {
                continue;
            }

            // Garante que cada quarto conte no máximo 1 vez como ocupado em uma mesma data d
            Set<LocalDate> datasOcupadas = datasOcupadasPorQuarto.get(q.getId());
            for (LocalDate d = iniIntersecao; !d.isAfter(fimIntersecao); d = d.plusDays(1)) {
                datasOcupadas.add(d);
            }

            long noitesNoPeriodo = ChronoUnit.DAYS.between(iniIntersecao, fimIntersecao) + 1;
            BigDecimal numerador = BigDecimal.valueOf(noitesNoPeriodo);
            BigDecimal denominador = BigDecimal.valueOf(totalNoitesEstadia);

            BigDecimal recebidoProp = h.getTotalRecebido()
                    .multiply(numerador)
                    .divide(denominador, 6, RoundingMode.HALF_UP);
            BigDecimal aReceberProp = h.getSaldoAReceber()
                    .multiply(numerador)
                    .divide(denominador, 6, RoundingMode.HALF_UP);

            recebidoPorQuarto.put(q.getId(), recebidoPorQuarto.get(q.getId()).add(recebidoProp));
            aReceberPorQuarto.put(q.getId(), aReceberPorQuarto.get(q.getId()).add(aReceberProp));
        }

        long totalDiariasDisponiveis = 0;
        long totalDiariasOcupadas = 0;
        BigDecimal somaRecebidoAltaPrecisao = BigDecimal.ZERO;
        BigDecimal somaAReceberAltaPrecisao = BigDecimal.ZERO;

        List<DesempenhoQuartoDTO> desempenhoPorQuarto = new ArrayList<>();
        for (Quarto q : quartosAtivos) {
            LocalDate inicioElegivel = dataInicio.isAfter(q.getDataCriacao()) ? dataInicio : q.getDataCriacao();
            long dispQuarto = inicioElegivel.isAfter(dataFim)
                    ? 0
                    : ChronoUnit.DAYS.between(inicioElegivel, dataFim) + 1;
            long ocupQuarto = datasOcupadasPorQuarto.get(q.getId()).size();
            if (ocupQuarto > dispQuarto) {
                ocupQuarto = dispQuarto;
            }
            long vagasQuarto = dispQuarto - ocupQuarto;

            BigDecimal recQuartoBruto = recebidoPorQuarto.get(q.getId());
            BigDecimal aRecQuartoBruto = aReceberPorQuarto.get(q.getId());
            somaRecebidoAltaPrecisao = somaRecebidoAltaPrecisao.add(recQuartoBruto);
            somaAReceberAltaPrecisao = somaAReceberAltaPrecisao.add(aRecQuartoBruto);

            BigDecimal recQuarto = recQuartoBruto.setScale(2, RoundingMode.HALF_UP);
            BigDecimal aRecQuarto = aRecQuartoBruto.setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalQuarto = recQuartoBruto.add(aRecQuartoBruto).setScale(2, RoundingMode.HALF_UP);

            BigDecimal taxaOcup = calcularPercentual(ocupQuarto, dispQuarto);
            BigDecimal taxaVac = dispQuarto > 0 ? CEM.subtract(taxaOcup).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

            totalDiariasDisponiveis += dispQuarto;
            totalDiariasOcupadas += ocupQuarto;

            desempenhoPorQuarto.add(new DesempenhoQuartoDTO(
                    q.getId(),
                    q.getNumero(),
                    q.getDescricao(),
                    q.getAtivo(),
                    dispQuarto,
                    ocupQuarto,
                    vagasQuarto,
                    taxaVac,
                    taxaOcup,
                    recQuarto,
                    aRecQuarto,
                    totalQuarto
            ));
        }

        long totalDiariasVagas = totalDiariasDisponiveis - totalDiariasOcupadas;
        BigDecimal taxaOcupacaoGeral = calcularPercentual(totalDiariasOcupadas, totalDiariasDisponiveis);
        BigDecimal taxaVacanciaGeral = totalDiariasDisponiveis > 0
                ? CEM.subtract(taxaOcupacaoGeral).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        BigDecimal faturamentoRecebido = somaRecebidoAltaPrecisao.setScale(2, RoundingMode.HALF_UP);
        BigDecimal faturamentoAReceber = somaAReceberAltaPrecisao.setScale(2, RoundingMode.HALF_UP);
        BigDecimal faturamentoTotalAltaPrecisao = somaRecebidoAltaPrecisao.add(somaAReceberAltaPrecisao);
        BigDecimal faturamentoTotal = faturamentoTotalAltaPrecisao.setScale(2, RoundingMode.HALF_UP);

        BigDecimal diariaMedia = totalDiariasOcupadas > 0
                ? faturamentoTotalAltaPrecisao.divide(BigDecimal.valueOf(totalDiariasOcupadas), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        List<DisponibilidadeDiariaDTO> disponibilidadeDiaria = new ArrayList<>();
        for (LocalDate d = dataInicio; !d.isAfter(dataFim); d = d.plusDays(1)) {
            int elegiveisDia = 0;
            int ocupadosDia = 0;
            List<String> vagosDia = new ArrayList<>();

            for (Quarto q : quartosAtivos) {
                if (d.isBefore(q.getDataCriacao())) {
                    continue;
                }
                elegiveisDia++;
                if (datasOcupadasPorQuarto.get(q.getId()).contains(d)) {
                    ocupadosDia++;
                } else {
                    vagosDia.add(q.getNumero());
                }
            }

            disponibilidadeDiaria.add(new DisponibilidadeDiariaDTO(
                    d,
                    elegiveisDia,
                    ocupadosDia,
                    vagosDia.size(),
                    vagosDia
            ));
        }

        return new RelatorioVacanciaDTO(
                dataInicio,
                dataFim,
                quantidadeDiasPeriodo,
                totalDiariasDisponiveis,
                totalDiariasOcupadas,
                totalDiariasVagas,
                taxaVacanciaGeral,
                taxaOcupacaoGeral,
                faturamentoRecebido,
                faturamentoAReceber,
                faturamentoTotal,
                diariaMedia,
                desempenhoPorQuarto,
                disponibilidadeDiaria
        );
    }

    @Transactional(readOnly = true)
    public List<AuditoriaItemDTO> listarAuditoriaRecente(int limite) {
        int tam = Math.min(Math.max(limite, 1), 200);
        return historicoRepository.buscarRecentes(PageRequest.of(0, tam)).stream()
                .map(h -> new AuditoriaItemDTO(
                        h.getId(),
                        h.getQuarto().getNumero(),
                        h.getHospedagem() != null ? h.getHospedagem().getId() : null,
                        h.getUsuario().getNome(),
                        h.getTipoOperacao(),
                        h.getStatusAnterior(),
                        h.getStatusNovo(),
                        h.getDetalhes(),
                        h.getDataHora()
                ))
                .toList();
    }

    /**
     * Regra de pernoites ocupados:
     * - Para FINALIZADA com dataCheckoutReal preenchido: max(dataCheckin.plusDays(1), dataCheckoutReal.toLocalDate()).
     * - Para ATIVA, RESERVADA (ou FINALIZADA sem dataCheckoutReal): max(dataCheckin.plusDays(1), dataCheckoutPrevista).
     */
    static LocalDate calcularDataCheckoutEfetiva(Hospedagem h) {
        LocalDate minimoUmaDiaria = h.getDataCheckin().plusDays(1);
        if (h.getStatusHospedagem() == StatusHospedagem.FINALIZADA && h.getDataCheckoutReal() != null) {
            LocalDate saidaReal = h.getDataCheckoutReal().toLocalDate();
            return saidaReal.isAfter(minimoUmaDiaria) ? saidaReal : minimoUmaDiaria;
        }
        LocalDate prevista = h.getDataCheckoutPrevista() != null
                ? h.getDataCheckoutPrevista()
                : h.getDataCheckin().plusDays(h.getQuantidadeDiarias());
        return prevista.isAfter(minimoUmaDiaria) ? prevista : minimoUmaDiaria;
    }

    private BigDecimal calcularPercentual(long parte, long total) {
        if (total <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(parte)
                .multiply(CEM)
                .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
    }
}
