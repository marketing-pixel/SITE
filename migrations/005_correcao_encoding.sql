-- ============================================================
-- 005 — CORREÇÃO DE ENCODING (mojibake) + garantia de colunas
-- Textos gravados com UTF-8 lido como WIN1252/LATIN1 ficam com
-- acentos duplicados (ex.: "ArmÃ¡rios"). Esta migration corrige
-- de forma segura: só converte quando o resultado é UTF-8 válido;
-- se der qualquer problema, mantém o texto original.
-- ============================================================

-- Garante colunas das migrations 002-004 (idempotente)
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS principal BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE cores ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS public_id VARCHAR(500);
ALTER TABLE avaliacao_imagens ADD COLUMN IF NOT EXISTS public_id VARCHAR(500);

-- Função de correção: converte apenas textos com sinais de mojibake
CREATE OR REPLACE FUNCTION corrigir_mojibake(t text) RETURNS text AS $$
BEGIN
    IF t IS NULL OR t !~ '[ÃÂ]' THEN
        RETURN t;
    END IF;
    BEGIN
        RETURN convert_from(convert_to(t, 'WIN1252'), 'UTF8');
    EXCEPTION WHEN OTHERS THEN
        RETURN t;
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

UPDATE categorias
    SET nome = corrigir_mojibake(nome);
UPDATE produtos
    SET titulo       = corrigir_mojibake(titulo),
        linha        = corrigir_mojibake(linha),
        descricao    = corrigir_mojibake(descricao),
        parcelamento = corrigir_mojibake(parcelamento);
UPDATE cores
    SET nome = corrigir_mojibake(nome);
UPDATE caracteristicas
    SET modelo                = corrigir_mojibake(modelo),
        largura               = corrigir_mojibake(largura),
        comprimento           = corrigir_mojibake(comprimento),
        altura                = corrigir_mojibake(altura),
        outros                = corrigir_mojibake(outros),
        quantidade_assentos   = corrigir_mojibake(quantidade_assentos),
        compartimento_livros  = corrigir_mojibake(compartimento_livros);
UPDATE perguntas
    SET pergunta     = corrigir_mojibake(pergunta),
        resposta     = corrigir_mojibake(resposta),
        nome_cliente = corrigir_mojibake(nome_cliente);
UPDATE avaliacoes
    SET cliente           = corrigir_mojibake(cliente),
        comentario        = corrigir_mojibake(comentario),
        resposta_vendedor = corrigir_mojibake(resposta_vendedor);

-- Remove a função auxiliar após o uso
DROP FUNCTION corrigir_mojibake(text);
