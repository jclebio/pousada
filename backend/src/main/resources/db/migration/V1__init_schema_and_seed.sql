-- ============================================================================
-- V1: Esquema completo e dados iniciais (Quartos 01-05 + 1 Gerente + 3 Atendentes)
-- ============================================================================

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('GERENTE', 'ATENDENTE')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quartos (
    id BIGSERIAL PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    descricao VARCHAR(150),
    capacidade_maxima INTEGER NOT NULL DEFAULT 4 CHECK (capacidade_maxima >= 1),
    diaria_padrao NUMERIC(10, 2) CHECK (diaria_padrao IS NULL OR diaria_padrao >= 0),
    status VARCHAR(30) NOT NULL CHECK (status IN (
        'DISPONIVEL',
        'RESERVADO',
        'OCUPADO',
        'AGUARDANDO_LIMPEZA',
        'EM_LIMPEZA',
        'EM_MANUTENCAO'
    )),
    observacao_atual TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao DATE NOT NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_manutencao_observacao CHECK (
        status <> 'EM_MANUTENCAO' OR (observacao_atual IS NOT NULL AND LENGTH(TRIM(observacao_atual)) > 0)
    )
);

CREATE TABLE hospedagens (
    id BIGSERIAL PRIMARY KEY,
    quarto_id BIGINT NOT NULL REFERENCES quartos(id),
    usuario_registro_id BIGINT NOT NULL REFERENCES usuarios(id),
    usuario_estorno_id BIGINT REFERENCES usuarios(id),
    nome_hospede VARCHAR(150) NOT NULL,
    quantidade_pessoas INTEGER NOT NULL CHECK (quantidade_pessoas >= 1),
    data_checkin DATE NOT NULL,
    quantidade_diarias INTEGER NOT NULL CHECK (quantidade_diarias >= 1),
    data_checkout_prevista DATE NOT NULL,
    data_checkout_real TIMESTAMP,
    status_hospedagem VARCHAR(20) NOT NULL CHECK (status_hospedagem IN (
        'ATIVA',
        'FINALIZADA',
        'ESTORNADA',
        'RESERVADA',
        'CANCELADA'
    )),
    valor_total NUMERIC(10, 2) NOT NULL CHECK (valor_total >= 0),
    valor_antecipado NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (valor_antecipado >= 0),
    valor_pago_checkin NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (valor_pago_checkin >= 0),
    valor_pago_checkout NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (valor_pago_checkout >= 0),
    motivo_estorno VARCHAR(255),
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_hospedagem_ativa_por_quarto
    ON hospedagens (quarto_id)
    WHERE status_hospedagem = 'ATIVA';

CREATE INDEX idx_hospedagens_periodo
    ON hospedagens (status_hospedagem, data_checkin, data_checkout_prevista);

CREATE TABLE historico_operacoes (
    id BIGSERIAL PRIMARY KEY,
    quarto_id BIGINT NOT NULL REFERENCES quartos(id),
    hospedagem_id BIGINT REFERENCES hospedagens(id),
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id),
    tipo_operacao VARCHAR(40) NOT NULL,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30),
    detalhes TEXT,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historico_operacoes_data
    ON historico_operacoes (data_hora DESC);

-- ============================================================================
-- Seed Inicial: 1 GERENTE e 3 ATENDENTES
-- gerente    -> gerente123
-- atendente1 -> atendente123
-- atendente2 -> atendente123
-- atendente3 -> atendente123
-- ============================================================================
INSERT INTO usuarios (nome, login, senha_hash, perfil, ativo) VALUES
    ('Gerente Geral', 'gerente', '$2a$10$uQEU0aXMMtnBOLVujxQYz.illAFbFbOvKZnT403aikaEDBUQxeMC.', 'GERENTE', TRUE),
    ('Atendente Turno Manhã', 'atendente1', '$2a$10$56y0RbmaEFDdI85JA1KJm.tbW0l/5Wz5rejIhef6DdqwlaA1Ufvn2', 'ATENDENTE', TRUE),
    ('Atendente Turno Tarde', 'atendente2', '$2a$10$dXdSSYmGdj3FU5AnMR6DOunbOOWAJ8z5HYkgOQYIk/ownc4HU8/KG', 'ATENDENTE', TRUE),
    ('Atendente Turno Noite', 'atendente3', '$2a$10$Tbm.TXcjaOr7mVDXx8p5l.BuJNe5Jrk55zPd5tkkC9NIsnkYIsm7W', 'ATENDENTE', TRUE);

-- ============================================================================
-- Seed Inicial: Quartos 01 a 05 (DISPONIVEL, ativo = true, data_criacao = 2026-01-01)
-- ============================================================================
INSERT INTO quartos (numero, descricao, capacidade_maxima, diaria_padrao, status, observacao_atual, ativo, data_criacao) VALUES
    ('01', 'Suíte Casal Térreo', 2, 180.00, 'DISPONIVEL', NULL, TRUE, '2026-01-01'),
    ('02', 'Suíte Casal Térreo', 2, 180.00, 'DISPONIVEL', NULL, TRUE, '2026-01-01'),
    ('03', 'Suíte Tripla Jardim', 3, 230.00, 'DISPONIVEL', NULL, TRUE, '2026-01-01'),
    ('04', 'Suíte Família', 4, 280.00, 'DISPONIVEL', NULL, TRUE, '2026-01-01'),
    ('05', 'Suíte Master Varanda', 4, 320.00, 'DISPONIVEL', NULL, TRUE, '2026-01-01');
