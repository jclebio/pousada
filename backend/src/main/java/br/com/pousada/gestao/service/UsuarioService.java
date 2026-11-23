package br.com.pousada.gestao.service;

import br.com.pousada.gestao.domain.entity.Usuario;
import br.com.pousada.gestao.domain.enums.PerfilUsuario;
import br.com.pousada.gestao.dto.usuario.AtualizarMeuPerfilRequest;
import br.com.pousada.gestao.dto.usuario.AtualizarUsuarioPorGerenteRequest;
import br.com.pousada.gestao.dto.usuario.CriarUsuarioRequest;
import br.com.pousada.gestao.dto.usuario.UsuarioDetalhesResponse;
import br.com.pousada.gestao.exception.RecursoNaoEncontradoException;
import br.com.pousada.gestao.exception.RegraNegocioException;
import br.com.pousada.gestao.repository.UsuarioRepository;
import br.com.pousada.gestao.security.UsuarioPrincipal;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioDetalhesResponse atualizarMeuPerfil(UsuarioPrincipal principal, AtualizarMeuPerfilRequest request) {
        Usuario usuario = usuarioRepository.findById(principal.getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        if (request.novaSenha() != null && !request.novaSenha().isBlank()) {
            if (request.senhaAtual() == null || request.senhaAtual().isBlank()) {
                throw new RegraNegocioException("A senha atual é obrigatória para definir uma nova senha.");
            }
            if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenhaHash())) {
                throw new RegraNegocioException("Senha atual incorreta.");
            }
            String novaSenhaLimpa = request.novaSenha().trim();
            if (novaSenhaLimpa.length() < 8) {
                throw new RegraNegocioException("A nova senha deve ter no mínimo 8 caracteres.");
            }
            usuario.setSenhaHash(passwordEncoder.encode(novaSenhaLimpa));
        }

        if (request.nome() != null && !request.nome().isBlank()) {
            usuario.setNome(request.nome().trim());
        }

        Usuario salvo = usuarioRepository.save(usuario);
        return toDetalhesResponse(salvo);
    }

    @Transactional(readOnly = true)
    public List<UsuarioDetalhesResponse> listarTodos() {
        return usuarioRepository.findAll(Sort.by("nome"))
                .stream()
                .map(this::toDetalhesResponse)
                .toList();
    }

    @Transactional
    public UsuarioDetalhesResponse atualizarPorGerente(Long id, AtualizarUsuarioPorGerenteRequest request, UsuarioPrincipal principal) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário com ID " + id + " não encontrado."));

        // Proteção contra bloqueio do próprio gerente logado
        if (usuario.getId().equals(principal.getId())) {
            if (Boolean.FALSE.equals(request.ativo())) {
                throw new RegraNegocioException("Você não pode inativar seu próprio usuário.");
            }
            if (request.perfil() != PerfilUsuario.GERENTE) {
                throw new RegraNegocioException("Você não pode remover seu próprio perfil de GERENTE.");
            }
        }

        usuario.setNome(request.nome().trim());
        usuario.setPerfil(request.perfil());
        usuario.setAtivo(request.ativo());

        if (request.novaSenha() != null && !request.novaSenha().isBlank()) {
            String novaSenhaLimpa = request.novaSenha().trim();
            if (novaSenhaLimpa.length() < 8) {
                throw new RegraNegocioException("A nova senha deve ter no mínimo 8 caracteres.");
            }
            usuario.setSenhaHash(passwordEncoder.encode(novaSenhaLimpa));
        }

        Usuario salvo = usuarioRepository.save(usuario);
        return toDetalhesResponse(salvo);
    }

    @Transactional
    public UsuarioDetalhesResponse criarUsuario(CriarUsuarioRequest request) {
        String loginNorm = request.login().trim().toLowerCase();
        if (usuarioRepository.findByLogin(loginNorm).isPresent()) {
            throw new RegraNegocioException("Já existe um usuário cadastrado com o login '" + loginNorm + "'.");
        }

        String senhaLimpa = request.senha().trim();
        if (senhaLimpa.length() < 8) {
            throw new RegraNegocioException("A senha inicial deve ter no mínimo 8 caracteres.");
        }

        Usuario novo = new Usuario();
        novo.setNome(request.nome().trim());
        novo.setLogin(loginNorm);
        novo.setSenhaHash(passwordEncoder.encode(senhaLimpa));
        novo.setPerfil(request.perfil());
        novo.setAtivo(true);

        Usuario salvo = usuarioRepository.save(novo);
        return toDetalhesResponse(salvo);
    }

    private UsuarioDetalhesResponse toDetalhesResponse(Usuario u) {
        return new UsuarioDetalhesResponse(
                u.getId(),
                u.getNome(),
                u.getLogin(),
                u.getPerfil(),
                u.getAtivo(),
                u.getCriadoEm()
        );
    }
}
