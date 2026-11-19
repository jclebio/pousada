package br.com.pousada.gestao.dto.quarto;

import br.com.pousada.gestao.domain.enums.StatusHospedagem;

import java.math.BigDecimal;
import java.time.LocalDate;

public record HospedagemResumoMapaDTO(
        Long id,
        String nomeHospede,
        Integer quantidadePessoas,
        LocalDate dataCheckin,
        Integer quantidadeDiarias,
        LocalDate dataCheckoutPrevista,
        StatusHospedagem statusHospedagem,
        BigDecimal valorTotal,
        BigDecimal valorAntecipado,
        BigDecimal valorPagoCheckin,
        BigDecimal saldoAReceber,
        String registradoPor
) {
}
