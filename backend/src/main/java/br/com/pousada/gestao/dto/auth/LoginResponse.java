package br.com.pousada.gestao.dto.auth;

public record LoginResponse(
        String token,
        UsuarioResumoDTO usuario
) {
}
