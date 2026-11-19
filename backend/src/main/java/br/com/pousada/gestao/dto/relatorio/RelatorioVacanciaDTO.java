package br.com.pousada.gestao.dto.relatorio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RelatorioVacanciaDTO(
        LocalDate dataInicio,
        LocalDate dataFim,
        long quantidadeDiasPeriodo,
        long totalDiariasDisponiveis,
        long totalDiariasOcupadas,
        long totalDiariasVagas,
        BigDecimal taxaVacanciaPercentual,
        BigDecimal taxaOcupacaoPercentual,
        BigDecimal faturamentoRecebido,
        BigDecimal faturamentoAReceber,
        BigDecimal faturamentoTotal,
        BigDecimal diariaMedia,
        List<DesempenhoQuartoDTO> desempenhoPorQuarto,
        List<DisponibilidadeDiariaDTO> disponibilidadeDiaria
) {
}
