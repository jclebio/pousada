package br.com.pousada.gestao.dto.quarto;

import br.com.pousada.gestao.domain.enums.StatusQuarto;
import jakarta.validation.constraints.NotNull;

public record AlterarStatusQuartoRequest(
        @NotNull(message = "Informe o novo status do quarto.")
        StatusQuarto novoStatus,

        String observacaoAtual
) {
}
