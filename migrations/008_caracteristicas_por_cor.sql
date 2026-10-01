-- ============================================================
-- CORTEZ MÓVEIS - CARACTERÍSTICAS POR COR
-- ============================================================

ALTER TABLE cores
    ADD COLUMN IF NOT EXISTS modelo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS largura VARCHAR(50),
    ADD COLUMN IF NOT EXISTS comprimento VARCHAR(50),
    ADD COLUMN IF NOT EXISTS outros TEXT,
    ADD COLUMN IF NOT EXISTS quantidade_assentos VARCHAR(50),
    ADD COLUMN IF NOT EXISTS compartimento_livros VARCHAR(50);

-- Migra os valores antigos das características do produto
-- para as cores já cadastradas, preservando dados existentes.
UPDATE cores c
SET
    modelo = COALESCE(c.modelo, ch.modelo),
    largura = COALESCE(c.largura, ch.largura),
    comprimento = COALESCE(c.comprimento, ch.comprimento),
    outros = COALESCE(c.outros, ch.outros),
    quantidade_assentos = COALESCE(c.quantidade_assentos, ch.quantidade_assentos),
    compartimento_livros = COALESCE(c.compartimento_livros, ch.compartimento_livros)
FROM (
    SELECT DISTINCT ON (produto_id)
        produto_id,
        modelo,
        largura,
        comprimento,
        outros,
        quantidade_assentos,
        compartimento_livros
    FROM caracteristicas
    ORDER BY produto_id, id ASC
) ch
WHERE ch.produto_id = c.produto_id;
