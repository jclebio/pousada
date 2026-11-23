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

    record DadosReservaWhatsApp(
            String numeroQuarto,
            String nomeHospede,
            int quantidadePessoas,
            LocalDate dataCheckin,
            int quantidadeDiarias,
            LocalDate dataCheckoutPrevista,
            BigDecimal valorTotal,
            BigDecimal valorAntecipado,
            String atendente
    ) {
    }

    record DadosRenovacaoWhatsApp(
            String numeroQuarto,
            String nomeHospede,
            int diariasAdicionais,
            int totalDiarias,
            LocalDate novaDataCheckout,
            BigDecimal acrescimo,
            BigDecimal novoTotal,
            BigDecimal saldoRestante,
            String atendente
    ) {
    }

    String notificarCheckin(DadosCheckinWhatsApp dados);

    String notificarCheckoutPedidoLimpeza(DadosCheckoutWhatsApp dados);

    String notificarQuartoDisponivel(String numeroQuarto, String responsavel);

    String notificarEntradaManutencao(String numeroQuarto, String motivoManutencao, String responsavel);

    String notificarEstornoCheckin(String numeroQuarto, String nomeHospede, String motivo, String gerente);

    String notificarReserva(DadosReservaWhatsApp dados);

    String notificarCancelamentoReserva(String numeroQuarto, String nomeHospede, String atendente);

    String notificarRenovacao(DadosRenovacaoWhatsApp dados);
}
