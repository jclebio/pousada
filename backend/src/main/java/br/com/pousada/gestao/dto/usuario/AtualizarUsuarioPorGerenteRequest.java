package br.com.pousada.gestao.dto.usuario;

import br.com.pousada.gestao.domain.enums.PerfilUsuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarUsuarioPorGerenteRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
        String nome,

        @NotNull(message = "O perfil é obrigatório.")
        PerfilUsuario perfil,

        @NotNull(message = "O status ativo é obrigatório.")
        Boolean ativo,

        @Size(min = 8, max = 100, message = "A nova senha deve ter no mínimo 8 caracteres.")
        String novaSenha
) {
}
