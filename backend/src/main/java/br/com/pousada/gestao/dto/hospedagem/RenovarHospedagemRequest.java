package br.com.pousada.gestao.dto.hospedagem;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record RenovarHospedagemRequest(
        @NotNull(message = "Informe a quantidade de diárias adicionais.")
        @Min(value = 1, message = "A renovação deve ser de no mínimo 1 diária.")
        Integer diariasAdicionais,

        @NotNull(message = "Informe o valor adicional da renovação.")
        @DecimalMin(value = "0.00", message = "O valor adicional não pode ser negativo.")
        BigDecimal valorAdicional,

        @DecimalMin(value = "0.00", message = "O valor pago agora não pode ser negativo.")
        BigDecimal valorPagoAgora,

        String observacao
) {
}
