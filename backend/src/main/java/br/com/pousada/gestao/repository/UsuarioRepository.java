package br.com.pousada.gestao.repository;

import br.com.pousada.gestao.domain.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByLoginAndAtivoTrue(String login);

    Optional<Usuario> findByLogin(String login);
}
