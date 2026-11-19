package br.com.pousada.gestao.controller;

import br.com.pousada.gestao.dto.hospedagem.CheckoutRequest;
import br.com.pousada.gestao.dto.hospedagem.HospedagemResponse;
import br.com.pousada.gestao.dto.quarto.AlterarStatusQuartoRequest;
import br.com.pousada.gestao.dto.quarto.ObservacaoRequest;
import br.com.pousada.gestao.dto.quarto.QuartoMapaDTO;
import br.com.pousada.gestao.dto.quarto.QuartoRequest;
import br.com.pousada.gestao.security.UsuarioPrincipal;
import br.com.pousada.gestao.service.HospedagemService;
import br.com.pousada.gestao.service.QuartoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/quartos")
public class QuartoController {

    private final QuartoService quartoService;
    private final HospedagemService hospedagemService;

    public QuartoController(QuartoService quartoService, HospedagemService hospedagemService) {
        this.quartoService = quartoService;
        this.hospedagemService = hospedagemService;
    }

    @GetMapping
    public ResponseEntity<List<QuartoMapaDTO>> listar(
            @RequestParam(defaultValue = "false") boolean incluirInativos,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(quartoService.listarMapa(incluirInativos, principal));
    }

    @PostMapping
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<QuartoMapaDTO> criar(
            @Valid @RequestBody QuartoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quartoService.criarQuarto(request, principal));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<QuartoMapaDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody QuartoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(quartoService.atualizarQuarto(id, request, principal));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<QuartoMapaDTO> alterarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AlterarStatusQuartoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(quartoService.alterarStatus(id, request, principal));
    }

    @PatchMapping("/{id}/observacao")
    public ResponseEntity<QuartoMapaDTO> atualizarObservacao(
            @PathVariable Long id,
            @RequestBody ObservacaoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(quartoService.atualizarObservacao(id, request, principal));
    }

    @PostMapping("/{quartoId}/checkout")
    public ResponseEntity<HospedagemResponse> checkout(
            @PathVariable Long quartoId,
            @Valid @RequestBody(required = false) CheckoutRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(hospedagemService.realizarCheckout(quartoId, request, principal));
    }
}
