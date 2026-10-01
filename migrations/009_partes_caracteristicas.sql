-- ============================================================
-- CORTEZ MÓVEIS - CARACTERÍSTICAS SEPARADAS POR PARTE
-- ============================================================

ALTER TABLE cores
    ADD COLUMN IF NOT EXISTS partes_caracteristicas JSONB;

UPDATE cores
SET partes_caracteristicas = jsonb_build_array(
    jsonb_build_object(
        'nome', 'Mesa',
        'modelo', COALESCE(modelo, ''),
        'largura', COALESCE(largura, ''),
        'comprimento', COALESCE(comprimento, ''),
        'altura', COALESCE(altura, ''),
        'outros', COALESCE(outros, ''),
        'quantidade_assentos', COALESCE(quantidade_assentos, ''),
        'compartimento_livros', COALESCE(compartimento_livros, '')
    ),
    jsonb_build_object(
        'nome', 'Cadeira',
        'modelo', '',
        'largura', '',
        'comprimento', '',
        'altura', '',
        'outros', '',
        'quantidade_assentos', '',
        'compartimento_livros', ''
    )
)
WHERE partes_caracteristicas IS NULL;
