package br.com.pousada.gestao.dto.quarto;

import br.com.pousada.gestao.domain.enums.StatusQuarto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record QuartoMapaDTO(
        Long id,
        String numero,
        String descricao,
        Integer capacidadeMaxima,
        BigDecimal diariaPadrao,
        StatusQuarto status,
        String observacaoAtual,
        Boolean ativo,
        LocalDate dataCriacao,
        LocalDateTime atualizadoEm,
        HospedagemResumoMapaDTO hospedagemAtual,
        HospedagemResumoMapaDTO proximaReserva
) {
}
