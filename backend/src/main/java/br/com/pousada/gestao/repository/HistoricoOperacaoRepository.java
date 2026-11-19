package br.com.pousada.gestao.repository;

import br.com.pousada.gestao.domain.entity.HistoricoOperacao;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HistoricoOperacaoRepository extends JpaRepository<HistoricoOperacao, Long> {

    @Query("""
            SELECT h FROM HistoricoOperacao h
            JOIN FETCH h.quarto q
            JOIN FETCH h.usuario u
            ORDER BY h.dataHora DESC, h.id DESC
            """)
    List<HistoricoOperacao> buscarRecentes(Pageable pageable);
}
