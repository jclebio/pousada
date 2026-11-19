package br.com.pousada.gestao.dto.hospedagem;

import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record CheckoutRequest(
        @DecimalMin(value = "0.00", message = "O valor pago no check-out não pode ser negativo.")
        BigDecimal valorPagoCheckout,

        String observacaoLimpeza
) {
}
