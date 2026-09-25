-- Mídia e cor vinculadas às avaliações dos clientes.
ALTER TABLE avaliacoes
    ADD COLUMN IF NOT EXISTS cor_id INTEGER REFERENCES cores(id) ON DELETE SET NULL;

ALTER TABLE avaliacao_imagens
    ADD COLUMN IF NOT EXISTS tipo_midia VARCHAR(10) NOT NULL DEFAULT 'imagem';

ALTER TABLE avaliacao_imagens
    DROP CONSTRAINT IF EXISTS avaliacao_imagens_tipo_midia_check;

ALTER TABLE avaliacao_imagens
    ADD CONSTRAINT avaliacao_imagens_tipo_midia_check
    CHECK (tipo_midia IN ('imagem', 'video'));

CREATE INDEX IF NOT EXISTS idx_avaliacoes_cor
    ON avaliacoes (cor_id);

CREATE INDEX IF NOT EXISTS idx_avaliacao_imagens_tipo
    ON avaliacao_imagens (tipo_midia);