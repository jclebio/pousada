package br.com.pousada.gestao.service;

import br.com.pousada.gestao.dto.auth.LoginRequest;
import br.com.pousada.gestao.dto.auth.LoginResponse;
import br.com.pousada.gestao.dto.auth.UsuarioResumoDTO;
import br.com.pousada.gestao.security.JwtService;
import br.com.pousada.gestao.security.UsuarioPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public LoginResponse autenticar(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.login().trim(), request.senha())
        );
        UsuarioPrincipal principal = (UsuarioPrincipal) authentication.getPrincipal();
        String token = jwtService.gerarToken(principal);
        return new LoginResponse(token, toResumo(principal));
    }

    public UsuarioResumoDTO toResumo(UsuarioPrincipal principal) {
        return new UsuarioResumoDTO(
                principal.getId(),
                principal.getNome(),
                principal.getLogin(),
                principal.getPerfil()
        );
    }
}
