package br.com.pousada.gestao.service.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Profile("!prod")
public class LogNotificacaoWhatsAppService implements NotificacaoWhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(LogNotificacaoWhatsAppService.class);

    @Override
    @Async("whatsappExecutor")
    public void notificarCheckin(DadosCheckinWhatsApp dados) {
        registrarNoConsole(FormatadorComprovanteWhatsApp.formatarCheckin(dados));
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarCheckoutPedidoLimpeza(DadosCheckoutWhatsApp dados) {
        registrarNoConsole(FormatadorComprovanteWhatsApp.formatarCheckout(dados));
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarQuartoDisponivel(String numeroQuarto, String responsavel) {
        registrarNoConsole(FormatadorComprovanteWhatsApp.formatarQuartoDisponivel(numeroQuarto, responsavel));
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarEntradaManutencao(String numeroQuarto, String motivoManutencao, String responsavel) {
        registrarNoConsole(FormatadorComprovanteWhatsApp.formatarManutencao(numeroQuarto, motivoManutencao, responsavel));
    }

    @Override
    @Async("whatsappExecutor")
    public void notificarEstornoCheckin(String numeroQuarto, String nomeHospede, String motivo, String gerente) {
        registrarNoConsole(FormatadorComprovanteWhatsApp.formatarEstorno(numeroQuarto, nomeHospede, motivo, gerente));
    }

    private void registrarNoConsole(String mensagem) {
        log.info("\n==================== [WHATSAPP DEV] ====================\n{}\n========================================================", mensagem);
    }
}
