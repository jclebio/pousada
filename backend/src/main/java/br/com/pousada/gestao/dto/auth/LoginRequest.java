package br.com.pousada.gestao.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Informe o login.")
        String login,

        @NotBlank(message = "Informe a senha.")
        String senha
) {
}
