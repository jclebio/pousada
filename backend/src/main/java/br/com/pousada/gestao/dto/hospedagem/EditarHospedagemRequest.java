package br.com.pousada.gestao.dto.hospedagem;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record EditarHospedagemRequest(
        @NotBlank(message = "O nome do hóspede é obrigatório.")
        String nomeHospede,

        @NotNull(message = "A quantidade de pessoas é obrigatória.")
        @Min(value = 1, message = "A hospedagem deve ter ao menos 1 pessoa.")
        Integer quantidadePessoas,

        @NotNull(message = "O valor total é obrigatório.")
        @DecimalMin(value = "0.00", message = "O valor total não pode ser negativo.")
        BigDecimal valorTotal,

        @DecimalMin(value = "0.00", message = "O valor pago não pode ser negativo.")
        BigDecimal valorPagoCheckin,

        @NotBlank(message = "Informe o motivo da alteração para registro de auditoria.")
        String motivo
) {
}
