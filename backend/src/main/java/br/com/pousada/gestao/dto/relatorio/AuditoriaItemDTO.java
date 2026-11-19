package br.com.pousada.gestao.dto.relatorio;

import br.com.pousada.gestao.domain.enums.StatusQuarto;

import java.time.LocalDateTime;

public record AuditoriaItemDTO(
        Long id,
        String numeroQuarto,
        Long hospedagemId,
        String usuarioNome,
        String tipoOperacao,
        StatusQuarto statusAnterior,
        StatusQuarto statusNovo,
        String detalhes,
        LocalDateTime dataHora
) {
}
