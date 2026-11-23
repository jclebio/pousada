package br.com.pousada.gestao.repository;

import br.com.pousada.gestao.domain.entity.Hospedagem;
import br.com.pousada.gestao.domain.enums.StatusHospedagem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface HospedagemRepository extends JpaRepository<Hospedagem, Long>, JpaSpecificationExecutor<Hospedagem> {

    @Query("""
            SELECT h FROM Hospedagem h
            JOIN FETCH h.quarto q
            JOIN FETCH h.usuarioRegistro u
            WHERE q.id = :quartoId AND h.statusHospedagem = :status
            ORDER BY h.id DESC
            """)
    List<Hospedagem> buscarPorQuartoEStatus(@Param("quartoId") Long quartoId,
                                            @Param("status") StatusHospedagem status);

    default Optional<Hospedagem> buscarAtivaPorQuarto(Long quartoId) {
        return buscarPorQuartoEStatus(quartoId, StatusHospedagem.ATIVA).stream().findFirst();
    }

    default Optional<Hospedagem> buscarReservadaPorQuarto(Long quartoId) {
        return buscarPorQuartoEStatus(quartoId, StatusHospedagem.RESERVADA).stream().findFirst();
    }

    @Query("""
            SELECT h FROM Hospedagem h
            JOIN FETCH h.quarto q
            JOIN FETCH h.usuarioRegistro u
            WHERE q.id = :quartoId AND h.statusHospedagem IN :statuses
            ORDER BY h.dataCheckin ASC, h.id ASC
            """)
    List<Hospedagem> buscarPorQuartoEStatuses(@Param("quartoId") Long quartoId,
                                              @Param("statuses") Collection<StatusHospedagem> statuses);

    @Query("""
            SELECT h FROM Hospedagem h
            JOIN FETCH h.quarto q
            JOIN FETCH h.usuarioRegistro u
            WHERE h.statusHospedagem IN :statuses
            ORDER BY h.dataCheckin ASC, h.id ASC
            """)
    List<Hospedagem> buscarTodasPorStatuses(@Param("statuses") Collection<StatusHospedagem> statuses);

    @Query("""
            SELECT h FROM Hospedagem h
            JOIN FETCH h.quarto q
            WHERE h.statusHospedagem IN :statuses
              AND h.dataCheckin <= :dataFim
            """)
    List<Hospedagem> buscarParaRelatorioAteDataFim(@Param("statuses") Collection<StatusHospedagem> statuses,
                                                   @Param("dataFim") LocalDate dataFim);
}
