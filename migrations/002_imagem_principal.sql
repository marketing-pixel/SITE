-- Adiciona campo principal à tabela imagens
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS principal BOOLEAN NOT NULL DEFAULT FALSE;