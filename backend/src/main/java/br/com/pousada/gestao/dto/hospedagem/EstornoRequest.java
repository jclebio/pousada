package br.com.pousada.gestao.dto.hospedagem;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EstornoRequest(
        @NotBlank(message = "Informe o motivo do estorno.")
        @Size(max = 255, message = "O motivo deve ter no máximo 255 caracteres.")
        String motivo
) {
}
