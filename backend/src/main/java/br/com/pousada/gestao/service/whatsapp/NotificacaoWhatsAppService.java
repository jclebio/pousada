package br.com.pousada.gestao.service.whatsapp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public interface NotificacaoWhatsAppService {

    record DadosCheckinWhatsApp(
            String numeroQuarto,
            String nomeHospede,
            int quantidadePessoas,
            LocalDate dataCheckin,
            int quantidadeDiarias,
            LocalDate dataCheckoutPrevista,
            BigDecimal valorTotal,
            BigDecimal totalPago,
            BigDecimal saldoAReceber,
            String atendente
    ) {
    }

    record DadosCheckoutWhatsApp(
            String numeroQuarto,
            String nomeHospede,
            LocalDateTime dataCheckoutReal,
            BigDecimal valorPagoCheckout,
            String observacaoLimpeza,
            String atendente
    ) {
    }

    void notificarCheckin(DadosCheckinWhatsApp dados);

    void notificarCheckoutPedidoLimpeza(DadosCheckoutWhatsApp dados);

    void notificarQuartoDisponivel(String numeroQuarto, String responsavel);

    void notificarEntradaManutencao(String numeroQuarto, String motivoManutencao, String responsavel);

    void notificarEstornoCheckin(String numeroQuarto, String nomeHospede, String motivo, String gerente);
}
