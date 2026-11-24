-- Migration V6: Adiciona coluna motivo_cancelamento na tabela hospedagens
ALTER TABLE hospedagens ADD COLUMN IF NOT EXISTS motivo_cancelamento VARCHAR(500);
