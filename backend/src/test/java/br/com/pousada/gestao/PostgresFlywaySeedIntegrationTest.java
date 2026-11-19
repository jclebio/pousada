package br.com.pousada.gestao;

import br.com.pousada.gestao.domain.entity.Quarto;
import br.com.pousada.gestao.domain.enums.StatusQuarto;
import br.com.pousada.gestao.repository.QuartoRepository;
import br.com.pousada.gestao.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@EnabledIf("postgresAtivo")
class PostgresFlywaySeedIntegrationTest {

    static boolean postgresAtivo() {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("localhost", 5432), 1000);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    @Autowired
    private QuartoRepository quartoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MockMvc mockMvc;

    @Test
    void deveValidarFlywayV1SeedQuartosEUsuariosNoPostgres16() throws Exception {
        List<Quarto> quartos = quartoRepository.findByAtivoTrueOrderByNumeroAsc();
        assertThat(quartos).hasSizeGreaterThanOrEqualTo(5);

        List<String> numeros = quartos.stream().map(Quarto::getNumero).toList();
        assertThat(numeros).contains("01", "02", "03", "04", "05");

        Quarto q01 = quartoRepository.findByNumero("01").orElseThrow();
        assertThat(q01.getStatus()).isEqualTo(StatusQuarto.DISPONIVEL);
        assertThat(q01.getAtivo()).isTrue();
        assertThat(q01.getDataCriacao()).isEqualTo(LocalDate.of(2026, 1, 1));

        assertThat(usuarioRepository.findByLogin("gerente")).isPresent();
        assertThat(usuarioRepository.findByLogin("atendente1")).isPresent();
        assertThat(usuarioRepository.findByLogin("atendente2")).isPresent();
        assertThat(usuarioRepository.findByLogin("atendente3")).isPresent();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"gerente\",\"senha\":\"gerente123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.perfil").value("GERENTE"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"atendente1\",\"senha\":\"atendente123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.perfil").value("ATENDENTE"));
    }
}
