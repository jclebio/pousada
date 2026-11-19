package br.com.pousada.gestao.dto.quarto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record QuartoRequest(
        @NotBlank(message = "O número do quarto é obrigatório.")
        @Size(max = 20, message = "O número do quarto deve ter no máximo 20 caracteres.")
        String numero,

        @Size(max = 150, message = "A descrição deve ter no máximo 150 caracteres.")
        String descricao,

        @Min(value = 1, message = "A capacidade máxima deve ser de pelo menos 1 pessoa.")
        Integer capacidadeMaxima,

        @DecimalMin(value = "0.00", message = "A diária padrão não pode ser negativa.")
        BigDecimal diariaPadrao,

        Boolean ativo,

        LocalDate dataCriacao
) {
}
