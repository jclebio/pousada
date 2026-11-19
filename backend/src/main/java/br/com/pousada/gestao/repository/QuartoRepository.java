package br.com.pousada.gestao.repository;

import br.com.pousada.gestao.domain.entity.Quarto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuartoRepository extends JpaRepository<Quarto, Long> {

    List<Quarto> findByAtivoTrueOrderByNumeroAsc();

    List<Quarto> findAllByOrderByNumeroAsc();

    Optional<Quarto> findByNumero(String numero);

    boolean existsByNumero(String numero);

    boolean existsByNumeroAndIdNot(String numero, Long id);
}
