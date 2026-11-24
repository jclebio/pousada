package br.com.pousada.gestao.domain.entity;

import br.com.pousada.gestao.domain.enums.StatusHospedagem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hospedagens")
public class Hospedagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quarto_id", nullable = false)
    private Quarto quarto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_registro_id", nullable = false)
    private Usuario usuarioRegistro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_estorno_id")
    private Usuario usuarioEstorno;

    @Column(name = "nome_hospede", nullable = false, length = 150)
    private String nomeHospede;

    @Column(name = "quantidade_pessoas", nullable = false)
    private Integer quantidadePessoas;

    @Column(name = "data_checkin", nullable = false)
    private LocalDate dataCheckin;

    @Column(name = "quantidade_diarias", nullable = false)
    private Integer quantidadeDiarias;

    @Column(name = "data_checkout_prevista", nullable = false)
    private LocalDate dataCheckoutPrevista;

    @Column(name = "data_checkout_real")
    private LocalDateTime dataCheckoutReal;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_hospedagem", nullable = false, length = 20)
    private StatusHospedagem statusHospedagem;

    @Column(name = "valor_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "valor_antecipado", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorAntecipado = BigDecimal.ZERO;

    @Column(name = "valor_pago_checkin", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorPagoCheckin = BigDecimal.ZERO;

    @Column(name = "valor_pago_checkout", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorPagoCheckout = BigDecimal.ZERO;

    @Column(name = "motivo_estorno", length = 255)
    private String motivoEstorno;

    @Column(name = "motivo_cancelamento", length = 500)
    private String motivoCancelamento;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    public void prePersist() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        if (valorAntecipado == null) {
            valorAntecipado = BigDecimal.ZERO;
        }
        if (valorPagoCheckin == null) {
            valorPagoCheckin = BigDecimal.ZERO;
        }
        if (valorPagoCheckout == null) {
            valorPagoCheckout = BigDecimal.ZERO;
        }
        if (dataCheckin != null && quantidadeDiarias != null) {
            dataCheckoutPrevista = dataCheckin.plusDays(quantidadeDiarias);
        }
    }

    public BigDecimal getTotalRecebido() {
        BigDecimal soma = nonNull(valorAntecipado)
                .add(nonNull(valorPagoCheckin))
                .add(nonNull(valorPagoCheckout));
        if (valorTotal != null && soma.compareTo(valorTotal) > 0) {
            return valorTotal;
        }
        return soma;
    }

    public BigDecimal getSaldoAReceber() {
        if (valorTotal == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal saldo = valorTotal.subtract(getTotalRecebido());
        return saldo.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : saldo;
    }

    private BigDecimal nonNull(BigDecimal val) {
        return val == null ? BigDecimal.ZERO : val;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Quarto getQuarto() {
        return quarto;
    }

    public void setQuarto(Quarto quarto) {
        this.quarto = quarto;
    }

    public Usuario getUsuarioRegistro() {
        return usuarioRegistro;
    }

    public void setUsuarioRegistro(Usuario usuarioRegistro) {
        this.usuarioRegistro = usuarioRegistro;
    }

    public Usuario getUsuarioEstorno() {
        return usuarioEstorno;
    }

    public void setUsuarioEstorno(Usuario usuarioEstorno) {
        this.usuarioEstorno = usuarioEstorno;
    }

    public String getNomeHospede() {
        return nomeHospede;
    }

    public void setNomeHospede(String nomeHospede) {
        this.nomeHospede = nomeHospede;
    }

    public Integer getQuantidadePessoas() {
        return quantidadePessoas;
    }

    public void setQuantidadePessoas(Integer quantidadePessoas) {
        this.quantidadePessoas = quantidadePessoas;
    }

    public LocalDate getDataCheckin() {
        return dataCheckin;
    }

    public void setDataCheckin(LocalDate dataCheckin) {
        this.dataCheckin = dataCheckin;
    }

    public Integer getQuantidadeDiarias() {
        return quantidadeDiarias;
    }

    public void setQuantidadeDiarias(Integer quantidadeDiarias) {
        this.quantidadeDiarias = quantidadeDiarias;
    }

    public LocalDate getDataCheckoutPrevista() {
        return dataCheckoutPrevista;
    }

    public void setDataCheckoutPrevista(LocalDate dataCheckoutPrevista) {
        this.dataCheckoutPrevista = dataCheckoutPrevista;
    }

    public LocalDateTime getDataCheckoutReal() {
        return dataCheckoutReal;
    }

    public void setDataCheckoutReal(LocalDateTime dataCheckoutReal) {
        this.dataCheckoutReal = dataCheckoutReal;
    }

    public StatusHospedagem getStatusHospedagem() {
        return statusHospedagem;
    }

    public void setStatusHospedagem(StatusHospedagem statusHospedagem) {
        this.statusHospedagem = statusHospedagem;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }

    public BigDecimal getValorAntecipado() {
        return valorAntecipado;
    }

    public void setValorAntecipado(BigDecimal valorAntecipado) {
        this.valorAntecipado = valorAntecipado;
    }

    public BigDecimal getValorPagoCheckin() {
        return valorPagoCheckin;
    }

    public void setValorPagoCheckin(BigDecimal valorPagoCheckin) {
        this.valorPagoCheckin = valorPagoCheckin;
    }

    public BigDecimal getValorPagoCheckout() {
        return valorPagoCheckout;
    }

    public void setValorPagoCheckout(BigDecimal valorPagoCheckout) {
        this.valorPagoCheckout = valorPagoCheckout;
    }

    public String getMotivoEstorno() {
        return motivoEstorno;
    }

    public void setMotivoEstorno(String motivoEstorno) {
        this.motivoEstorno = motivoEstorno;
    }

    public String getMotivoCancelamento() {
        return motivoCancelamento;
    }

    public void setMotivoCancelamento(String motivoCancelamento) {
        this.motivoCancelamento = motivoCancelamento;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }
}
