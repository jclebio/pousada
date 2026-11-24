package br.com.pousada.gestao.dto.hospedagem;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelarReservaRequest(
        @NotBlank(message = "O motivo do cancelamento é obrigatório.")
        @Size(max = 500, message = "O motivo não pode exceder 500 caracteres.")
        String motivo
) {}
