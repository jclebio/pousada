package br.com.pousada.gestao.dto.relatorio;

import java.math.BigDecimal;

public record DesempenhoQuartoDTO(
        Long quartoId,
        String numeroQuarto,
        String descricao,
        Boolean ativo,
        long diariasDisponiveis,
        long diariasOcupadas,
        long diariasVagas,
        BigDecimal taxaVacanciaPercentual,
        BigDecimal taxaOcupacaoPercentual,
        BigDecimal faturamentoRecebido,
        BigDecimal faturamentoAReceber,
        BigDecimal faturamentoTotal
) {
}
