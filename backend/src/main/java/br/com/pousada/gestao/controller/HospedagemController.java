package br.com.pousada.gestao.controller;

import br.com.pousada.gestao.dto.hospedagem.CheckinRequest;
import br.com.pousada.gestao.dto.hospedagem.EditarHospedagemRequest;
import br.com.pousada.gestao.dto.hospedagem.EstornoRequest;
import br.com.pousada.gestao.dto.hospedagem.HospedagemResponse;
import br.com.pousada.gestao.dto.hospedagem.RenovarHospedagemRequest;
import br.com.pousada.gestao.dto.hospedagem.ReservaRequest;
import br.com.pousada.gestao.domain.enums.StatusHospedagem;
import br.com.pousada.gestao.security.UsuarioPrincipal;
import br.com.pousada.gestao.service.HospedagemService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

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

    @GetMapping
    public ResponseEntity<Page<HospedagemResponse>> listarHistorico(
            @RequestParam(required = false) Set<StatusHospedagem> status,
            @RequestParam(required = false) Long quartoId,
            @RequestParam(required = false) String nomeHospede,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<HospedagemResponse> resultado = hospedagemService.listarHistorico(
                status, quartoId, nomeHospede, dataInicio, dataFim, page, size);
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/exportar/csv")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) Set<StatusHospedagem> status,
            @RequestParam(required = false) Long quartoId,
            @RequestParam(required = false) String nomeHospede,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        byte[] csv = hospedagemService.exportarCsv(status, quartoId, nomeHospede, dataInicio, dataFim);
        String filename = "historico-hospedagens-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
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

    @PatchMapping("/{id}/renovar")
    public ResponseEntity<HospedagemResponse> renovar(
            @PathVariable Long id,
            @Valid @RequestBody RenovarHospedagemRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(hospedagemService.renovarDiarias(id, request, principal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HospedagemResponse> editar(
            @PathVariable Long id,
            @Valid @RequestBody EditarHospedagemRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal
    ) {
        return ResponseEntity.ok(hospedagemService.editarHospedagem(id, request, principal));
    }
}
