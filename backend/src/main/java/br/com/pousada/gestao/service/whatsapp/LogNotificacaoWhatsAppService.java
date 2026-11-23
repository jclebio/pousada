package br.com.pousada.gestao.service.whatsapp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!prod")
public class LogNotificacaoWhatsAppService implements NotificacaoWhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(LogNotificacaoWhatsAppService.class);

    @Override
    public String notificarCheckin(DadosCheckinWhatsApp dados) {
        String msg = FormatadorComprovanteWhatsApp.formatarCheckin(dados);
        registrarNoConsole(msg);
        return msg;
    }

    @Override
    public String notificarCheckoutPedidoLimpeza(DadosCheckoutWhatsApp dados) {
        String msg = FormatadorComprovanteWhatsApp.formatarCheckout(dados);
        registrarNoConsole(msg);
        return msg;
    }

    @Override
    public String notificarQuartoDisponivel(String numeroQuarto, String responsavel) {
        String msg = FormatadorComprovanteWhatsApp.formatarQuartoDisponivel(numeroQuarto, responsavel);
        registrarNoConsole(msg);
        return msg;
    }

    @Override
    public String notificarEntradaManutencao(String numeroQuarto, String motivoManutencao, String responsavel) {
        String msg = FormatadorComprovanteWhatsApp.formatarManutencao(numeroQuarto, motivoManutencao, responsavel);
        registrarNoConsole(msg);
        return msg;
    }

    @Override
    public String notificarEstornoCheckin(String numeroQuarto, String nomeHospede, String motivo, String gerente) {
        String msg = FormatadorComprovanteWhatsApp.formatarEstorno(numeroQuarto, nomeHospede, motivo, gerente);
        registrarNoConsole(msg);
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
        registrarNoConsole(msg);
        return msg;
    }

    @Override
    public String notificarCancelamentoReserva(String numeroQuarto, String nomeHospede, String atendente) {
        String msg = FormatadorComprovanteWhatsApp.formatarCancelamentoReserva(numeroQuarto, nomeHospede, atendente);
        registrarNoConsole(msg);
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
        registrarNoConsole(msg);
        return msg;
    }

    private void registrarNoConsole(String mensagem) {
        log.info("\n==================== [WHATSAPP DEV] ====================\n{}\n========================================================", mensagem);
    }
}
