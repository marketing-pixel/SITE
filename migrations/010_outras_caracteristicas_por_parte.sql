-- ============================================================
-- CORTEZ MÓVEIS - OUTRAS CARACTERÍSTICAS EDITÁVEIS POR PARTE
-- ============================================================
-- A estrutura já está em cores.partes_caracteristicas (JSONB).
-- Esta migration materializa a lista "outras_caracteristicas"
-- para os dados antigos, sem obrigar Mesa a exibir "Quantidade de assentos".

UPDATE cores
SET partes_caracteristicas = (
    SELECT COALESCE(
        jsonb_agg(
            p || jsonb_build_object(
                'outras_caracteristicas',
                CASE
                    WHEN jsonb_typeof(p->'outras_caracteristicas') = 'array'
                        THEN p->'outras_caracteristicas'
                    ELSE (
                        SELECT COALESCE(
                            jsonb_agg(
                                jsonb_build_object('nome', x.nome, 'valor', x.valor)
                                ORDER BY x.ordem
                            ),
                            '[]'::jsonb
                        )
                        FROM (
                            VALUES
                                (1, 'Outros', p->>'outros'),
                                (2, 'Compartimento para livros', p->>'compartimento_livros'),
                                (3, 'Quantidade de assentos',
                                    CASE WHEN lower(COALESCE(p->>'nome','')) = 'mesa' THEN NULL ELSE p->>'quantidade_assentos' END)
                        ) AS x(ordem,nome,valor)
                        WHERE COALESCE(x.valor,'') <> ''
                    )
            )
            ORDER BY item.ord
        ),
        '[]'::jsonb
    )
    FROM jsonb_array_elements(COALESCE(cores.partes_caracteristicas,'[]'::jsonb))
         WITH ORDINALITY AS item(p,ord)
)
WHERE partes_caracteristicas IS NOT NULL;
