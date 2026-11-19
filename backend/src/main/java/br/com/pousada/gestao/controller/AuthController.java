package br.com.pousada.gestao.controller;

import br.com.pousada.gestao.dto.auth.LoginRequest;
import br.com.pousada.gestao.dto.auth.LoginResponse;
import br.com.pousada.gestao.dto.auth.UsuarioResumoDTO;
import br.com.pousada.gestao.security.UsuarioPrincipal;
import br.com.pousada.gestao.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.autenticar(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResumoDTO> me(@AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(authService.toResumo(principal));
    }
}
