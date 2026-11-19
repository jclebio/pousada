package br.com.pousada.gestao.dto.auth;

import br.com.pousada.gestao.domain.enums.PerfilUsuario;

public record UsuarioResumoDTO(
        Long id,
        String nome,
        String login,
        PerfilUsuario perfil
) {
}
