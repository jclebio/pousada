package br.com.pousada.gestao.service.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@Profile("prod")
public class WebhookNotificacaoWhatsAppService implements NotificacaoWhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WebhookNotificacaoWhatsAppService.class);

    private final RestClient restClient;
    private final String webhookUrl;
    private final String apiToken;
    private final String destinoGrupo;

    public WebhookNotificacaoWhatsAppService(
            @Value("${app.whatsapp.webhook-url}") String webhookUrl,
            @Value("${app.whatsapp.api-token:}") String apiToken,
            @Value("${app.whatsapp.destino-grupo:}") String destinoGrupo
    ) {
        this.restClient = RestClient.create();
        this.webhookUrl = webhookUrl;
        this.apiToken = apiToken;
        this.destinoGrupo = destinoGrupo;
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarCheckin(DadosCheckinWhatsApp dados) {
        enviarWebhook(FormatadorComprovanteWhatsApp.formatarCheckin(dados));
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarCheckoutPedidoLimpeza(DadosCheckoutWhatsApp dados) {
        enviarWebhook(FormatadorComprovanteWhatsApp.formatarCheckout(dados));
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarQuartoDisponivel(String numeroQuarto, String responsavel) {
        enviarWebhook(FormatadorComprovanteWhatsApp.formatarQuartoDisponivel(numeroQuarto, responsavel));
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarEntradaManutencao(String numeroQuarto, String motivoManutencao, String responsavel) {
        enviarWebhook(FormatadorComprovanteWhatsApp.formatarManutencao(numeroQuarto, motivoManutencao, responsavel));
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarEstornoCheckin(String numeroQuarto, String nomeHospede, String motivo, String gerente) {
        enviarWebhook(FormatadorComprovanteWhatsApp.formatarEstorno(numeroQuarto, nomeHospede, motivo, gerente));
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
