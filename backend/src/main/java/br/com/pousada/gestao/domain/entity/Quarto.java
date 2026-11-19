package br.com.pousada.gestao.domain.entity;

import br.com.pousada.gestao.domain.enums.StatusQuarto;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "quartos")
public class Quarto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String numero;

    @Column(length = 150)
    private String descricao;

    @Column(name = "capacidade_maxima", nullable = false)
    private Integer capacidadeMaxima = 4;

    @Column(name = "diaria_padrao", precision = 10, scale = 2)
    private BigDecimal diariaPadrao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatusQuarto status = StatusQuarto.DISPONIVEL;

    @Column(name = "observacao_atual", columnDefinition = "TEXT")
    private String observacaoAtual;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "data_criacao", nullable = false)
    private LocalDate dataCriacao;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @PrePersist
    public void prePersist() {
        if (status == null) {
            status = StatusQuarto.DISPONIVEL;
        }
        if (ativo == null) {
            ativo = true;
        }
        if (capacidadeMaxima == null) {
            capacidadeMaxima = 4;
        }
        if (dataCriacao == null) {
            dataCriacao = LocalDate.now();
        }
        atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        atualizadoEm = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Integer getCapacidadeMaxima() {
        return capacidadeMaxima;
    }

    public void setCapacidadeMaxima(Integer capacidadeMaxima) {
        this.capacidadeMaxima = capacidadeMaxima;
    }

    public BigDecimal getDiariaPadrao() {
        return diariaPadrao;
    }

    public void setDiariaPadrao(BigDecimal diariaPadrao) {
        this.diariaPadrao = diariaPadrao;
    }

    public StatusQuarto getStatus() {
        return status;
    }

    public void setStatus(StatusQuarto status) {
        this.status = status;
    }

    public String getObservacaoAtual() {
        return observacaoAtual;
    }

    public void setObservacaoAtual(String observacaoAtual) {
        this.observacaoAtual = observacaoAtual;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public LocalDate getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDate dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }
}
