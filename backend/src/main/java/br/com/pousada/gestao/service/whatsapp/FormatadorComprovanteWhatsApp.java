package br.com.pousada.gestao.service.whatsapp;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class FormatadorComprovanteWhatsApp {

    private static final DateTimeFormatter DATA_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATA_HORA_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale PT_BR = Locale.of("pt", "BR");

    private FormatadorComprovanteWhatsApp() {
    }

    public static String formatarCheckin(NotificacaoWhatsAppService.DadosCheckinWhatsApp d) {
        return """
                🏨 *COMPROVANTE DE CHECK-IN*
                • Quarto: *%s*
                • Hóspede: %s (%d pessoa(s))
                • Entrada: %s | Diárias: %d
                • Saída prevista: *%s*
                • Valor Total: %s
                • Recebido até agora: %s
                • Saldo a Receber: %s
                • Registrado por: %s""".formatted(
                d.numeroQuarto(),
                d.nomeHospede(),
                d.quantidadePessoas(),
                d.dataCheckin().format(DATA_FMT),
                d.quantidadeDiarias(),
                d.dataCheckoutPrevista().format(DATA_FMT),
                moeda(d.valorTotal()),
                moeda(d.totalPago()),
                moeda(d.saldoAReceber()),
                d.atendente()
        );
    }

    public static String formatarCheckout(NotificacaoWhatsAppService.DadosCheckoutWhatsApp d) {
        String obs = (d.observacaoLimpeza() != null && !d.observacaoLimpeza().isBlank())
                ? "\n• Obs. Limpeza: " + d.observacaoLimpeza().trim()
                : "";
        return """
                🧹 *CHECK-OUT REALIZADO / PEDIDO DE LIMPEZA*
                • Quarto: *%s* (Aguardando Limpeza)
                • Hóspede: %s
                • Saída real: %s
                • Quitado na saída: %s
                • Responsável: %s%s""".formatted(
                d.numeroQuarto(),
                d.nomeHospede(),
                d.dataCheckoutReal().format(DATA_HORA_FMT),
                moeda(d.valorPagoCheckout()),
                d.atendente(),
                obs
        );
    }

    public static String formatarQuartoDisponivel(String numeroQuarto, String responsavel) {
        return """
                ✅ *QUARTO LIBERADO E DISPONÍVEL*
                • Quarto: *%s* pronto para nova hospedagem
                • Liberado por: %s""".formatted(numeroQuarto, responsavel);
    }

    public static String formatarManutencao(String numeroQuarto, String motivo, String responsavel) {
        return """
                🛠️ *QUARTO EM MANUTENÇÃO*
                • Quarto: *%s*
                • Motivo: %s
                • Registrado por: %s""".formatted(numeroQuarto, motivo, responsavel);
    }

    public static String formatarEstorno(String numeroQuarto, String nomeHospede, String motivo, String gerente) {
        return """
                ↩️ *CHECK-IN ESTORNADO*
                • Quarto: *%s* (retornou para DISPONÍVEL)
                • Hóspede: %s
                • Motivo: %s
                • Gerente: %s""".formatted(numeroQuarto, nomeHospede, motivo, gerente);
    }

    private static String moeda(BigDecimal valor) {
        NumberFormat nf = NumberFormat.getCurrencyInstance(PT_BR);
        return nf.format(valor == null ? BigDecimal.ZERO : valor);
    }
}
