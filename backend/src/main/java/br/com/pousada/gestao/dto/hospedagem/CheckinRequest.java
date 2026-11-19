package br.com.pousada.gestao.dto.hospedagem;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CheckinRequest(
        @NotNull(message = "Selecione o quarto.")
        Long quartoId,

        Long reservaId,

        @NotBlank(message = "Informe o nome do hóspede.")
        @Size(max = 150, message = "O nome do hóspede deve ter no máximo 150 caracteres.")
        String nomeHospede,

        @NotNull(message = "Informe a quantidade de pessoas.")
        @Min(value = 1, message = "A quantidade de pessoas deve ser no mínimo 1.")
        Integer quantidadePessoas,

        LocalDate dataCheckin,

        @NotNull(message = "Informe a quantidade de diárias.")
        @Min(value = 1, message = "A quantidade de diárias deve ser no mínimo 1.")
        Integer quantidadeDiarias,

        @NotNull(message = "Informe o valor pago no check-in.")
        @DecimalMin(value = "0.00", message = "O valor pago no check-in não pode ser negativo.")
        BigDecimal valorPagoCheckin,

        @DecimalMin(value = "0.00", message = "O valor antecipado não pode ser negativo.")
        BigDecimal valorAntecipado,

        @DecimalMin(value = "0.00", message = "O valor total não pode ser negativo.")
        BigDecimal valorTotal,

        String observacaoQuarto
) {
}
