package br.com.pousada.gestao.dto.usuario;

import br.com.pousada.gestao.domain.enums.PerfilUsuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarUsuarioRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
        String nome,

        @NotBlank(message = "O login é obrigatório.")
        @Size(min = 3, max = 50, message = "O login deve ter entre 3 e 50 caracteres.")
        String login,

        @NotBlank(message = "A senha inicial é obrigatória.")
        @Size(min = 8, max = 100, message = "A senha deve ter no mínimo 8 caracteres.")
        String senha,

        @NotNull(message = "O perfil é obrigatório.")
        PerfilUsuario perfil
) {
}
