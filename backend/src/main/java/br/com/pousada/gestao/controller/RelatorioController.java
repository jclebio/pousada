package br.com.pousada.gestao.controller;

import br.com.pousada.gestao.dto.relatorio.AuditoriaItemDTO;
import br.com.pousada.gestao.dto.relatorio.RelatorioVacanciaDTO;
import br.com.pousada.gestao.service.RelatorioVacanciaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class RelatorioController {

    private final RelatorioVacanciaService relatorioVacanciaService;

    public RelatorioController(RelatorioVacanciaService relatorioVacanciaService) {
        this.relatorioVacanciaService = relatorioVacanciaService;
    }

    @GetMapping("/relatorios/vacancia")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<RelatorioVacanciaDTO> vacancia(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return ResponseEntity.ok(relatorioVacanciaService.gerarRelatorio(dataInicio, dataFim));
    }

    @GetMapping("/auditoria")
    @PreAuthorize("hasRole('GERENTE')")
    public ResponseEntity<List<AuditoriaItemDTO>> auditoria(
            @RequestParam(defaultValue = "50") int limite
    ) {
        return ResponseEntity.ok(relatorioVacanciaService.listarAuditoriaRecente(limite));
    }
}
