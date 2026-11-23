package br.com.pousada.gestao.service.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.concurrent.Executor;

@Service
@Profile("prod")
public class WebhookNotificacaoWhatsAppService implements NotificacaoWhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WebhookNotificacaoWhatsAppService.class);

    private final RestClient restClient;
    private final String webhookUrl;
    private final String apiToken;
    private final String destinoGrupo;
    private final Executor executor;

    public WebhookNotificacaoWhatsAppService(
            @Value("${app.whatsapp.webhook-url}") String webhookUrl,
            @Value("${app.whatsapp.api-token:}") String apiToken,
            @Value("${app.whatsapp.destino-grupo:}") String destinoGrupo,
            @Qualifier("whatsappExecutor") Executor executor
    ) {
        this.restClient = RestClient.create();
        this.webhookUrl = webhookUrl;
        this.apiToken = apiToken;
        this.destinoGrupo = destinoGrupo;
        this.executor = executor;
    }

    @Override
    public String notificarCheckin(DadosCheckinWhatsApp dados) {
        String msg = FormatadorComprovanteWhatsApp.formatarCheckin(dados);
        dispararAssincrono(msg);
        return msg;
    }

    @Override
    public String notificarCheckoutPedidoLimpeza(DadosCheckoutWhatsApp dados) {
        String msg = FormatadorComprovanteWhatsApp.formatarCheckout(dados);
        dispararAssincrono(msg);
        return msg;
    }

    @Override
    public String notificarQuartoDisponivel(String numeroQuarto, String responsavel) {
        String msg = FormatadorComprovanteWhatsApp.formatarQuartoDisponivel(numeroQuarto, responsavel);
        dispararAssincrono(msg);
        return msg;
    }

    @Override
    public String notificarEntradaManutencao(String numeroQuarto, String motivoManutencao, String responsavel) {
        String msg = FormatadorComprovanteWhatsApp.formatarManutencao(numeroQuarto, motivoManutencao, responsavel);
        dispararAssincrono(msg);
        return msg;
    }

    @Override
    public String notificarEstornoCheckin(String numeroQuarto, String nomeHospede, String motivo, String gerente) {
        String msg = FormatadorComprovanteWhatsApp.formatarEstorno(numeroQuarto, nomeHospede, motivo, gerente);
        dispararAssincrono(msg);
        return msg;
    }

    @Override
    public String notificarReserva(DadosReservaWhatsApp dados) {
        String msg = FormatadorComprovanteWhatsApp.formatarReserva(
                dados.numeroQuarto(),
                dados.nomeHospede(),
                dados.quantidadePessoas(),
                dados.dataCheckin(),
                dados.quantidadeDiarias(),
                dados.dataCheckoutPrevista(),
                dados.valorTotal(),
                dados.valorAntecipado(),
                dados.atendente()
        );
        dispararAssincrono(msg);
        return msg;
    }

    @Override
    public String notificarCancelamentoReserva(String numeroQuarto, String nomeHospede, String atendente) {
        String msg = FormatadorComprovanteWhatsApp.formatarCancelamentoReserva(numeroQuarto, nomeHospede, atendente);
        dispararAssincrono(msg);
        return msg;
    }

    @Override
    public String notificarRenovacao(DadosRenovacaoWhatsApp dados) {
        String msg = FormatadorComprovanteWhatsApp.formatarRenovacao(
                dados.numeroQuarto(),
                dados.nomeHospede(),
                dados.diariasAdicionais(),
                dados.totalDiarias(),
                dados.novaDataCheckout(),
                dados.acrescimo(),
                dados.novoTotal(),
                dados.saldoRestante(),
                dados.atendente()
        );
        dispararAssincrono(msg);
        return msg;
    }

    private void dispararAssincrono(String texto) {
        if (executor != null) {
            executor.execute(() -> enviarWebhook(texto));
        } else {
            enviarWebhook(texto);
        }
    }

    private void enviarWebhook(String texto) {
        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.warn("WHATSAPP_WEBHOOK_URL não configurada em prod; mensagem ignorada.");
            return;
        }
        try {
            var request = restClient.post()
                    .uri(webhookUrl)
                    .contentType(MediaType.APPLICATION_JSON);
            if (apiToken != null && !apiToken.isBlank()) {
                request = request.header("apikey", apiToken).header("Authorization", "Bearer " + apiToken);
            }
            request.body(Map.of(
                    "number", destinoGrupo == null ? "" : destinoGrupo,
                    "text", texto
            )).retrieve().toBodilessEntity();
        } catch (Exception ex) {
            log.error("Falha ao disparar webhook do WhatsApp: {}", ex.getMessage());
        }
    }
}
