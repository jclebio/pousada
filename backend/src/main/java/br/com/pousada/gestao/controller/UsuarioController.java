package br.com.pousada.gestao.controller;

import br.com.pousada.gestao.dto.usuario.AtualizarMeuPerfilRequest;
import br.com.pousada.gestao.dto.usuario.AtualizarUsuarioPorGerenteRequest;
import br.com.pousada.gestao.dto.usuario.CriarUsuarioRequest;
import br.com.pousada.gestao.dto.usuario.UsuarioDetalhesResponse;
import br.com.pousada.gestao.security.UsuarioPrincipal;
import br.com.pousada.gestao.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PutMapping("/meu-perfil")
    public ResponseEntity<UsuarioDetalhesResponse> atualizarMeuPerfil(
            @Valid @RequestBody AtualizarMeuPerfilRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(usuarioService.atualizarMeuPerfil(principal, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<List<UsuarioDetalhesResponse>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    @PostMapping
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<UsuarioDetalhesResponse> criarUsuario(
            @Valid @RequestBody CriarUsuarioRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.criarUsuario(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<UsuarioDetalhesResponse> atualizarPorGerente(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarUsuarioPorGerenteRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(usuarioService.atualizarPorGerente(id, request, principal));
    }
}
