package br.com.pousada.gestao.dto.relatorio;

import java.time.LocalDate;
import java.util.List;

public record DisponibilidadeDiariaDTO(
        LocalDate data,
        int totalQuartosElegiveis,
        int totalOcupados,
        int totalVagos,
        List<String> quartosVagos
) {
}
