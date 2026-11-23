package br.com.pousada.gestao;

import br.com.pousada.gestao.domain.entity.Hospedagem;
import br.com.pousada.gestao.domain.entity.Quarto;
import br.com.pousada.gestao.domain.entity.Usuario;
import br.com.pousada.gestao.domain.enums.PerfilUsuario;
import br.com.pousada.gestao.domain.enums.StatusHospedagem;
import br.com.pousada.gestao.domain.enums.StatusQuarto;
import br.com.pousada.gestao.repository.HistoricoOperacaoRepository;
import br.com.pousada.gestao.repository.HospedagemRepository;
import br.com.pousada.gestao.repository.QuartoRepository;
import br.com.pousada.gestao.repository.UsuarioRepository;
import br.com.pousada.gestao.service.whatsapp.NotificacaoWhatsAppService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PousadaFluxoOperacionalERelatorioTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private QuartoRepository quartoRepository;

    @Autowired
    private HospedagemRepository hospedagemRepository;

    @Autowired
    private HistoricoOperacaoRepository historicoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoSpyBean
    private NotificacaoWhatsAppService notificacaoWhatsAppService;

    private String tokenGerente;
    private String tokenAtendente;
    private Usuario gerente;
    private Quarto quarto01;
    private Quarto quarto02;

    @BeforeEach
    void setUp() throws Exception {
        historicoRepository.deleteAll();
        hospedagemRepository.deleteAll();
        quartoRepository.deleteAll();
        usuarioRepository.deleteAll();
        clearInvocations(notificacaoWhatsAppService);

        gerente = criarUsuario("Gerente Geral", "gerente", "gerente123", PerfilUsuario.GERENTE);
        criarUsuario("Atendente 1", "atendente1", "atendente123", PerfilUsuario.ATENDENTE);

        quarto01 = criarQuarto("01", LocalDate.of(2026, 1, 1));
        quarto02 = criarQuarto("02", LocalDate.of(2026, 5, 6));

        tokenGerente = login("gerente", "gerente123");
        tokenAtendente = login("atendente1", "atendente123");
    }

    @Test
    void deveLiberarCorsParaRedeLocalNoPerfilDev() throws Exception {
        mockMvc.perform(options("/api/quartos")
                        .header("Origin", "http://192.168.1.45:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://192.168.1.45:5173"));
    }

    @Test
    void deveCumprirFluxoCheckinCheckoutLimpezaManutencaoRBACEWhatsApp() throws Exception {
        // 1. Check-in sem valorTotal separado -> valorTotal = valorPagoCheckin e dataCheckoutPrevista calculada
        String payloadCheckin = """
                {
                  "quartoId": %d,
                  "nomeHospede": "Carlos Silva",
                  "quantidadePessoas": 2,
                  "dataCheckin": "2026-05-10",
                  "quantidadeDiarias": 3,
                  "valorPagoCheckin": 540.00
                }
                """.formatted(quarto01.getId());

        MvcResult resCheckin = mockMvc.perform(post("/api/hospedagens/checkin")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadCheckin))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dataCheckoutPrevista").value("2026-05-13"))
                .andExpect(jsonPath("$.valorTotal").value(540.00))
                .andExpect(jsonPath("$.saldoAReceber").value(0.00))
                .andReturn();

        Long hospedagemId = objectMapper.readTree(resCheckin.getResponse().getContentAsString()).get("id").asLong();
        verify(notificacaoWhatsAppService, timeout(2000)).notificarCheckin(any());

        // 2. Atendente NÃO pode estornar check-in nem acessar relatório nem criar quarto
        mockMvc.perform(post("/api/hospedagens/" + hospedagemId + "/estornar")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivo\":\"Engano\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/relatorios/vacancia?dataInicio=2026-05-01&dataFim=2026-05-10")
                        .header("Authorization", "Bearer " + tokenAtendente))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/quartos")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"numero\":\"06\"}"))
                .andExpect(status().isForbidden());

        // 3. Check-out -> quarto vai para AGUARDANDO_LIMPEZA e notifica WhatsApp
        mockMvc.perform(post("/api/quartos/" + quarto01.getId() + "/checkout")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusHospedagem").value("FINALIZADA"));

        verify(notificacaoWhatsAppService, timeout(2000)).notificarCheckoutPedidoLimpeza(any());
        clearInvocations(notificacaoWhatsAppService);

        // 4. Transição AGUARDANDO_LIMPEZA -> EM_LIMPEZA NÃO deve disparar WhatsApp
        mockMvc.perform(patch("/api/quartos/" + quarto01.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"novoStatus\":\"EM_LIMPEZA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_LIMPEZA"));

        verify(notificacaoWhatsAppService, never()).notificarQuartoDisponivel(any(), any());
        verify(notificacaoWhatsAppService, never()).notificarEntradaManutencao(any(), any(), any());

        // 5. EM_LIMPEZA -> DISPONIVEL dispara WhatsApp de quarto disponível
        mockMvc.perform(patch("/api/quartos/" + quarto01.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"novoStatus\":\"DISPONIVEL\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DISPONIVEL"));

        verify(notificacaoWhatsAppService, timeout(2000)).notificarQuartoDisponivel(eq("01"), any());

        // 6. EM_MANUTENCAO sem observação falha (400), com observação funciona
        mockMvc.perform(patch("/api/quartos/" + quarto01.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"novoStatus\":\"EM_MANUTENCAO\",\"observacaoAtual\":\"   \"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/quartos/" + quarto01.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"novoStatus\":\"EM_MANUTENCAO\",\"observacaoAtual\":\"Troca de chuveiro\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_MANUTENCAO"));

        verify(notificacaoWhatsAppService, timeout(2000))
                .notificarEntradaManutencao(eq("01"), eq("Troca de chuveiro"), any());
    }

    @Test
    void deveCalcularVacanciaEFaturamentoRespeitandoDataCriacaoCheckoutEfetivoEDeduplicacaoNoMesmoDia() throws Exception {
        // Janela consultada: 2026-05-01 a 2026-05-10 (10 dias)
        // quarto01 criado em 2026-01-01 -> 10 diárias disponíveis
        // quarto02 criado em 2026-05-06 -> 5 diárias disponíveis (06, 07, 08, 09, 10)
        // Total disponível = 15 diárias.

        // Hospedagem 1 (quarto01): Check-in 01/05 para 3 diárias (previsto 04/05), mas saiu antecipado em 01/05 às 19h!
        // Regra: max(dataCheckin.plusDays(1), dataCheckoutReal.toLocalDate()) = max(02/05, 01/05) = 02/05 (1 pernoite: 01/05)
        salvarHospedagem(quarto01, "Hóspede Saída Mesmo Dia", LocalDate.of(2026, 5, 1), 3,
                LocalDateTime.of(2026, 5, 1, 19, 0), StatusHospedagem.FINALIZADA,
                new BigDecimal("200.00"), BigDecimal.ZERO, new BigDecimal("200.00"), BigDecimal.ZERO);

        // Hospedagem 2 (quarto01): Novo check-in no MESMO dia 01/05 por 2 diárias (01/05 e 02/05 -> saída 03/05), ATIVA, pago parcial
        // Pernoite 01/05 NÃO pode contar em dobro! Pernoites únicos ocupados em quarto01 até aqui: {01/05, 02/05} = 2
        salvarHospedagem(quarto01, "Hóspede Novo Mesmo Dia", LocalDate.of(2026, 5, 1), 2,
                null, StatusHospedagem.ATIVA,
                new BigDecimal("400.00"), BigDecimal.ZERO, new BigDecimal("150.00"), BigDecimal.ZERO);

        // Hospedagem 3 (quarto02): RESERVADA cruzando o fim da janela: 09/05 por 4 diárias (09, 10, 11, 12 -> saída 13/05)
        // Apenas 2 de 4 diárias (50%) caem em [01/05, 10/05]. Total=800, Sinal=200 -> no período: Recebido=100, A Receber=300
        salvarHospedagem(quarto02, "Hóspede Reserva Futura", LocalDate.of(2026, 5, 9), 4,
                null, StatusHospedagem.RESERVADA,
                new BigDecimal("800.00"), new BigDecimal("200.00"), BigDecimal.ZERO, BigDecimal.ZERO);

        // Hospedagens ESTORNADA e CANCELADA devem ser ignoradas
        salvarHospedagem(quarto01, "Estornado", LocalDate.of(2026, 5, 5), 2,
                null, StatusHospedagem.ESTORNADA,
                new BigDecimal("500.00"), BigDecimal.ZERO, new BigDecimal("500.00"), BigDecimal.ZERO);
        salvarHospedagem(quarto02, "Cancelado", LocalDate.of(2026, 5, 7), 1,
                null, StatusHospedagem.CANCELADA,
                new BigDecimal("300.00"), new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);

        MvcResult res = mockMvc.perform(get("/api/relatorios/vacancia")
                        .param("dataInicio", "2026-05-01")
                        .param("dataFim", "2026-05-10")
                        .header("Authorization", "Bearer " + tokenGerente))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());

        assertThat(json.get("totalDiariasDisponiveis").asLong()).isEqualTo(15L);
        // Ocupadas: quarto01 = 2 (01/05 deduplicado + 02/05), quarto02 = 2 (09/05 + 10/05) => total = 4
        assertThat(json.get("totalDiariasOcupadas").asLong()).isEqualTo(4L);
        assertThat(json.get("totalDiariasVagas").asLong()).isEqualTo(11L);

        // Recebido: 200 (H1) + 150 (H2) + 100 (50% de H3) = 450.00
        // A Receber: 0 (H1) + 250 (H2) + 300 (50% de H3) = 550.00
        // Total = 1000.00 | Diária Média = 1000.00 / 4 = 250.00
        assertThat(new BigDecimal(json.get("faturamentoRecebido").asText())).isEqualByComparingTo("450.00");
        assertThat(new BigDecimal(json.get("faturamentoAReceber").asText())).isEqualByComparingTo("550.00");
        assertThat(new BigDecimal(json.get("faturamentoTotal").asText())).isEqualByComparingTo("1000.00");
        assertThat(new BigDecimal(json.get("diariaMedia").asText())).isEqualByComparingTo("250.00");

        // No dia 01/05, apenas quarto01 existia e estava ocupado -> 1 elegível, 1 ocupado, 0 vagos (ocupação nunca > 100%)
        JsonNode dia01 = json.get("disponibilidadeDiaria").get(0);
        assertThat(dia01.get("data").asText()).isEqualTo("2026-05-01");
        assertThat(dia01.get("totalQuartosElegiveis").asInt()).isEqualTo(1);
        assertThat(dia01.get("totalOcupados").asInt()).isEqualTo(1);
        assertThat(dia01.get("totalVagos").asInt()).isEqualTo(0);
    }

    @Test
    void deveGerenciarReservasFuturasConflitoDeDatasECancelamento() throws Exception {
        LocalDate hoje = LocalDate.now();
        LocalDate futura = hoje.plusDays(5);

        // 1. Agendar reserva futura não altera o status do quarto hoje (permanece DISPONIVEL)
        String payloadReservaFutura = """
                {
                  "quartoId": %d,
                  "nomeHospede": "Fernanda Lima",
                  "quantidadePessoas": 2,
                  "dataCheckin": "%s",
                  "quantidadeDiarias": 3,
                  "valorTotal": 600.00,
                  "valorAntecipado": 100.00
                }
                """.formatted(quarto01.getId(), futura.toString());

        MvcResult resReserva = mockMvc.perform(post("/api/hospedagens/reserva")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadReservaFutura))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statusHospedagem").value("RESERVADA"))
                .andReturn();

        Long reservaId = objectMapper.readTree(resReserva.getResponse().getContentAsString()).get("id").asLong();

        // O quarto continua DISPONÍVEL no banco
        Quarto q01Banco = quartoRepository.findById(quarto01.getId()).orElseThrow();
        assertThat(q01Banco.getStatus()).isEqualTo(StatusQuarto.DISPONIVEL);

        // GET /api/quartos deve retornar quarto DISPONIVEL com proximaReserva preenchida
        mockMvc.perform(get("/api/quartos")
                        .header("Authorization", "Bearer " + tokenAtendente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("DISPONIVEL"))
                .andExpect(jsonPath("$[0].hospedagemAtual").doesNotExist())
                .andExpect(jsonPath("$[0].proximaReserva.nomeHospede").value("Fernanda Lima"))
                .andExpect(jsonPath("$[0].proximaReserva.dataCheckin").value(futura.toString()));

        // 2. Conflito de datas ao tentar nova reserva sobreposta (futura + 1 até futura + 4)
        String payloadConflito = """
                {
                  "quartoId": %d,
                  "nomeHospede": "Outro Cliente",
                  "quantidadePessoas": 1,
                  "dataCheckin": "%s",
                  "quantidadeDiarias": 3,
                  "valorTotal": 500.00
                }
                """.formatted(quarto01.getId(), futura.plusDays(1).toString());

        mockMvc.perform(post("/api/hospedagens/reserva")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadConflito))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("Conflito de datas no Quarto 01")));

        // 3. Reserva para HOJE no quarto02 deve colocar o quarto como RESERVADO
        String payloadHoje = """
                {
                  "quartoId": %d,
                  "nomeHospede": "Chegada Hoje",
                  "quantidadePessoas": 2,
                  "dataCheckin": "%s",
                  "quantidadeDiarias": 2,
                  "valorTotal": 400.00
                }
                """.formatted(quarto02.getId(), hoje.toString());

        mockMvc.perform(post("/api/hospedagens/reserva")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadHoje))
                .andExpect(status().isCreated());

        Quarto q02Banco = quartoRepository.findById(quarto02.getId()).orElseThrow();
        assertThat(q02Banco.getStatus()).isEqualTo(StatusQuarto.RESERVADO);

        // 3.1 Listagem de reservas ativas (GET /api/hospedagens/reservas)
        mockMvc.perform(get("/api/hospedagens/reservas")
                        .header("Authorization", "Bearer " + tokenAtendente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].nomeHospede").value("Chegada Hoje"))
                .andExpect(jsonPath("$[1].nomeHospede").value("Fernanda Lima"));

        // 4. Cancelamento de reserva
        mockMvc.perform(post("/api/hospedagens/" + reservaId + "/cancelar")
                        .header("Authorization", "Bearer " + tokenAtendente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusHospedagem").value("CANCELADA"));

        // Após cancelamento, proximaReserva no quarto01 volta a ser nula
        mockMvc.perform(get("/api/quartos")
                        .header("Authorization", "Bearer " + tokenAtendente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].proximaReserva").doesNotExist());
    }

    @Test
    void deveRenovarDiariasValidandoConflitosEEditarComAuditoria() throws Exception {
        LocalDate hoje = LocalDate.now();

        // Checkin de 2 diárias no quarto01 (de hoje até hoje + 2)
        Hospedagem ativa = salvarHospedagem(quarto01, "Lucas Hóspede", hoje, 2,
                null, StatusHospedagem.ATIVA,
                new BigDecimal("400.00"), BigDecimal.ZERO, new BigDecimal("400.00"), BigDecimal.ZERO);
        quarto01.setStatus(StatusQuarto.OCUPADO);
        quartoRepository.save(quarto01);

        // Reserva futura agendada para hoje + 3 até hoje + 5
        salvarHospedagem(quarto01, "Próximo Hóspede", hoje.plusDays(3), 2,
                null, StatusHospedagem.RESERVADA,
                new BigDecimal("400.00"), new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);

        // 1. Tentar renovar por +2 diárias (de hoje+2 até hoje+4) -> conflito com reserva de hoje+3!
        mockMvc.perform(patch("/api/hospedagens/" + ativa.getId() + "/renovar")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "diariasAdicionais": 2,
                                  "valorAdicional": 400.00,
                                  "valorPagoAgora": 0.00,
                                  "observacao": "Quer esticar a viagem"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("Conflito de datas no Quarto 01")));

        // 2. Renovar por +1 diária (de hoje+2 até hoje+3) -> sem sobreposição, deve funcionar!
        mockMvc.perform(patch("/api/hospedagens/" + ativa.getId() + "/renovar")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "diariasAdicionais": 1,
                                  "valorAdicional": 200.00,
                                  "valorPagoAgora": 200.00,
                                  "observacao": "Fica mais 1 dia"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidadeDiarias").value(3))
                .andExpect(jsonPath("$.valorTotal").value(600.00))
                .andExpect(jsonPath("$.totalRecebido").value(600.00))
                .andExpect(jsonPath("$.saldoAReceber").value(0.00))
                .andExpect(jsonPath("$.mensagemWhatsapp").isNotEmpty());

        // 3. Finalizar hospedagem para testar regras de edição pós-checkout
        ativa = hospedagemRepository.findById(ativa.getId()).orElseThrow();
        ativa.setStatusHospedagem(StatusHospedagem.FINALIZADA);
        ativa.setDataCheckoutReal(LocalDateTime.now());
        hospedagemRepository.save(ativa);

        // 4. Atendente tenta editar hospedagem finalizada -> bloqueado
        mockMvc.perform(put("/api/hospedagens/" + ativa.getId())
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeHospede": "Lucas Alterado",
                                  "quantidadePessoas": 2,
                                  "valorTotal": 600.00,
                                  "valorPagoCheckin": 600.00,
                                  "motivo": "Correção de grafia"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("Apenas usuários com perfil GERENTE podem editar hospedagens já finalizadas")));

        // 5. Gerente edita hospedagem finalizada -> permitido com motivo e auditoria registrada
        mockMvc.perform(put("/api/hospedagens/" + ativa.getId())
                        .header("Authorization", "Bearer " + tokenGerente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nomeHospede": "Lucas Corrigido",
                                  "quantidadePessoas": 2,
                                  "valorTotal": 650.00,
                                  "valorPagoCheckin": 600.00,
                                  "motivo": "Ajuste de consumo pós-fechamento"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeHospede").value("Lucas Corrigido"))
                .andExpect(jsonPath("$.valorTotal").value(650.00));
    }

    // ─── Item 4: Histórico de hospedagens ─────────────────────────────────────

    @Test
    void deveListarHistoricoPaginadoComFiltros() throws Exception {
        LocalDate hoje = LocalDate.now();

        // Cria hospedagens com status variados
        salvarHospedagem(quarto01, "Carlos Silva", hoje.minusDays(10), 3,
                hoje.minusDays(7).atStartOfDay(), StatusHospedagem.FINALIZADA,
                new BigDecimal("600.00"), BigDecimal.ZERO, new BigDecimal("600.00"), BigDecimal.ZERO);
        salvarHospedagem(quarto01, "Ana Beatriz", hoje.minusDays(5), 2,
                null, StatusHospedagem.ATIVA,
                new BigDecimal("400.00"), BigDecimal.ZERO, new BigDecimal("400.00"), BigDecimal.ZERO);
        salvarHospedagem(quarto02, "Carlos Pereira", hoje.minusDays(20), 5,
                hoje.minusDays(15).atStartOfDay(), StatusHospedagem.FINALIZADA,
                new BigDecimal("1000.00"), BigDecimal.ZERO, new BigDecimal("1000.00"), BigDecimal.ZERO);
        salvarHospedagem(quarto02, "Fernanda Oliveira", hoje.plusDays(5), 3,
                null, StatusHospedagem.RESERVADA,
                new BigDecimal("900.00"), new BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal.ZERO);
        salvarHospedagem(quarto01, "Maria Santos", hoje.minusDays(30), 2,
                null, StatusHospedagem.CANCELADA,
                new BigDecimal("400.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

        // 1. Sem filtros: retorna todos os 5 registros (paginados, 20 por página)
        mockMvc.perform(get("/api/hospedagens")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.content").isArray());

        // 2. Filtro por status=FINALIZADA: deve retornar 2
        mockMvc.perform(get("/api/hospedagens")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .param("status", "FINALIZADA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        // 3. Filtro por status=RESERVADA: deve retornar 1
        mockMvc.perform(get("/api/hospedagens")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .param("status", "RESERVADA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].nomeHospede").value("Fernanda Oliveira"));

        // 4. Filtro por nomeHospede=Carlos: deve retornar 2 (Carlos Silva e Carlos Pereira)
        mockMvc.perform(get("/api/hospedagens")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .param("nomeHospede", "Carlos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        // 5. Filtro por quartoId
        mockMvc.perform(get("/api/hospedagens")
                        .header("Authorization", "Bearer " + tokenGerente)
                        .param("quartoId", String.valueOf(quarto02.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        // 6. Filtro por dataInicio e dataFim abrangendo apenas os últimos 7 dias
        mockMvc.perform(get("/api/hospedagens")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .param("dataInicio", hoje.minusDays(7).toString())
                        .param("dataFim", hoje.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1)); // Ana Beatriz: checkin hoje-5

        // 7. Ordenação padrão DESC: o primeiro resultado deve ter dataCheckin mais recente
        MvcResult resultOrdem = mockMvc.perform(get("/api/hospedagens")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .param("status", "FINALIZADA"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(resultOrdem.getResponse().getContentAsString());
        JsonNode content = body.get("content");
        assertThat(content).isNotNull();
        String primeiroCheckin = content.get(0).get("dataCheckin").asText();
        String segundoCheckin = content.get(1).get("dataCheckin").asText();
        assertThat(primeiroCheckin).isGreaterThan(segundoCheckin);

        // 8. Paginação: size=2 → page 0 tem 2 itens, totalElements=5, last=false
        mockMvc.perform(get("/api/hospedagens")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.last").value(false));
    }

    @Test
    void deveExportarCsvDoHistoricoComFiltros() throws Exception {
        LocalDate hoje = LocalDate.now();
        salvarHospedagem(quarto01, "Carlos Export", hoje.minusDays(3), 2,
                hoje.minusDays(1).atStartOfDay(), StatusHospedagem.FINALIZADA,
                new BigDecimal("500.00"), BigDecimal.ZERO, new BigDecimal("500.00"), BigDecimal.ZERO);

        MvcResult result = mockMvc.perform(get("/api/hospedagens/exportar/csv")
                        .header("Authorization", "Bearer " + tokenAtendente)
                        .param("status", "FINALIZADA"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv;charset=UTF-8"))
                .andExpect(header().exists("Content-Disposition"))
                .andReturn();

        String csv = result.getResponse().getContentAsString();
        assertThat(csv).contains("Quarto;Hóspede;Status;Pessoas;Check-in;Saída Prevista;Check-out Real;Diárias;Valor Total;Valor Antecipado;Valor Check-in;Valor Check-out;Total Recebido;Saldo a Receber;Registrado Por");
        assertThat(csv).contains("Carlos Export");
        assertThat(csv).contains("FINALIZADA");
        assertThat(csv).contains("500,00");
    }

    private String login(String login, String senha) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"" + login + "\",\"senha\":\"" + senha + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private Usuario criarUsuario(String nome, String login, String senha, PerfilUsuario perfil) {
        Usuario u = new Usuario();
        u.setNome(nome);
        u.setLogin(login);
        u.setSenhaHash(passwordEncoder.encode(senha));
        u.setPerfil(perfil);
        u.setAtivo(true);
        return usuarioRepository.save(u);
    }

    private Quarto criarQuarto(String numero, LocalDate dataCriacao) {
        Quarto q = new Quarto();
        q.setNumero(numero);
        q.setDescricao("Quarto " + numero);
        q.setCapacidadeMaxima(3);
        q.setDiariaPadrao(new BigDecimal("200.00"));
        q.setStatus(StatusQuarto.DISPONIVEL);
        q.setAtivo(true);
        q.setDataCriacao(dataCriacao);
        return quartoRepository.save(q);
    }

    private Hospedagem salvarHospedagem(Quarto quarto,
                                        String hospede,
                                        LocalDate checkin,
                                        int diarias,
                                        LocalDateTime checkoutReal,
                                        StatusHospedagem status,
                                        BigDecimal valorTotal,
                                        BigDecimal valorAntecipado,
                                        BigDecimal valorPagoCheckin,
                                        BigDecimal valorPagoCheckout) {
        Hospedagem h = new Hospedagem();
        h.setQuarto(quarto);
        h.setUsuarioRegistro(gerente);
        h.setNomeHospede(hospede);
        h.setQuantidadePessoas(2);
        h.setDataCheckin(checkin);
        h.setQuantidadeDiarias(diarias);
        h.setDataCheckoutPrevista(checkin.plusDays(diarias));
        h.setDataCheckoutReal(checkoutReal);
        h.setStatusHospedagem(status);
        h.setValorTotal(valorTotal);
        h.setValorAntecipado(valorAntecipado);
        h.setValorPagoCheckin(valorPagoCheckin);
        h.setValorPagoCheckout(valorPagoCheckout);
        return hospedagemRepository.save(h);
    }
}
