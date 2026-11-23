package br.com.pousada.gestao.dto.usuario;

import br.com.pousada.gestao.domain.enums.PerfilUsuario;
import java.time.LocalDateTime;

public record UsuarioDetalhesResponse(
        Long id,
        String nome,
        String login,
        PerfilUsuario perfil,
        Boolean ativo,
        LocalDateTime criadoEm
) {
}
