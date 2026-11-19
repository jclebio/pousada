package br.com.pousada.gestao.controller;

import br.com.pousada.gestao.dto.hospedagem.CheckinRequest;
import br.com.pousada.gestao.dto.hospedagem.EstornoRequest;
import br.com.pousada.gestao.dto.hospedagem.HospedagemResponse;
import br.com.pousada.gestao.dto.hospedagem.ReservaRequest;
import br.com.pousada.gestao.security.UsuarioPrincipal;
import br.com.pousada.gestao.service.HospedagemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hospedagens")
public class HospedagemController {

    private final HospedagemService hospedagemService;

    public HospedagemController(HospedagemService hospedagemService) {
        this.hospedagemService = hospedagemService;
    }

    @PostMapping("/checkin")
    public ResponseEntity<HospedagemResponse> checkin(
            @Valid @RequestBody CheckinRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hospedagemService.realizarCheckin(request, principal));
    }

    @PostMapping("/reserva")
    public ResponseEntity<HospedagemResponse> reserva(
            @Valid @RequestBody ReservaRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hospedagemService.registrarReserva(request, principal));
    }

    @GetMapping("/reservas")
    public ResponseEntity<List<HospedagemResponse>> listarReservas() {
        return ResponseEntity.ok(hospedagemService.listarReservasAtivas());
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<HospedagemResponse> cancelarReserva(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(hospedagemService.cancelarReserva(id, principal));
    }

    @PostMapping("/{id}/estornar")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<HospedagemResponse> estornar(
            @PathVariable Long id,
            @Valid @RequestBody EstornoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(hospedagemService.estornarCheckin(id, request, principal));
    }
}
