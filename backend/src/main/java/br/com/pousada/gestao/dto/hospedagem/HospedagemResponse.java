package br.com.pousada.gestao.dto.hospedagem;

import br.com.pousada.gestao.domain.enums.StatusHospedagem;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record HospedagemResponse(
        Long id,
        Long quartoId,
        String numeroQuarto,
        String nomeHospede,
        Integer quantidadePessoas,
        LocalDate dataCheckin,
        Integer quantidadeDiarias,
        LocalDate dataCheckoutPrevista,
        LocalDateTime dataCheckoutReal,
        StatusHospedagem statusHospedagem,
        BigDecimal valorTotal,
        BigDecimal valorAntecipado,
        BigDecimal valorPagoCheckin,
        BigDecimal valorPagoCheckout,
        BigDecimal totalRecebido,
        BigDecimal saldoAReceber,
        String registradoPor
) {
}
