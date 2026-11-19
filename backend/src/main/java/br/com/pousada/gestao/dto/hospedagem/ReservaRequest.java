package br.com.pousada.gestao.dto.hospedagem;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReservaRequest(
        @NotNull(message = "Selecione o quarto.")
        Long quartoId,

        @NotBlank(message = "Informe o nome do hóspede.")
        @Size(max = 150, message = "O nome do hóspede deve ter no máximo 150 caracteres.")
        String nomeHospede,

        @NotNull(message = "Informe a quantidade de pessoas.")
        @Min(value = 1, message = "A quantidade de pessoas deve ser no mínimo 1.")
        Integer quantidadePessoas,

        @NotNull(message = "Informe a data prevista de entrada.")
        LocalDate dataCheckin,

        @NotNull(message = "Informe a quantidade de diárias.")
        @Min(value = 1, message = "A quantidade de diárias deve ser no mínimo 1.")
        Integer quantidadeDiarias,

        @NotNull(message = "Informe o valor total da reserva.")
        @DecimalMin(value = "0.00", message = "O valor total não pode ser negativo.")
        BigDecimal valorTotal,

        @DecimalMin(value = "0.00", message = "O sinal antecipado não pode ser negativo.")
        BigDecimal valorAntecipado,

        String observacaoQuarto
) {
}
