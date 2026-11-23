package br.com.pousada.gestao.dto.usuario;

import jakarta.validation.constraints.Size;

public record AtualizarMeuPerfilRequest(
        @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
        String nome,

        String senhaAtual,

        @Size(min = 8, max = 100, message = "A nova senha deve ter no mínimo 8 caracteres.")
        String novaSenha
) {
}
