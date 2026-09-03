-- Adiciona descrição específica para cada cor/modelo do produto

ALTER TABLE cores
ADD COLUMN IF NOT EXISTS descricao TEXT;