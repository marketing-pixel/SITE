-- ============================================================
-- CORTEZ MÓVEIS - MIGRATION INICIAL
-- Banco: cortez_moveis
-- Sem comandos destrutivos (sem DROP DATABASE, sem DROP TABLE)
-- ============================================================

-- 1. ADMIN
CREATE TABLE IF NOT EXISTS admin (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    nome        VARCHAR(255),
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SESSÕES (cookie HttpOnly, token armazenado como hash)
CREATE TABLE IF NOT EXISTS sessoes (
    id          SERIAL PRIMARY KEY,
    admin_id    INTEGER NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) UNIQUE NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expira_em   TIMESTAMPTZ NOT NULL,
    ativa       BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. CATEGORIAS
CREATE TABLE IF NOT EXISTS categorias (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(255) UNIQUE NOT NULL,
    slug        VARCHAR(255) UNIQUE NOT NULL,
    ativa       BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUTOS
CREATE TABLE IF NOT EXISTS produtos (
    id              SERIAL PRIMARY KEY,
    categoria_id    INTEGER NOT NULL REFERENCES categorias(id),
    titulo          VARCHAR(255) NOT NULL,
    linha           VARCHAR(255),
    preco           NUMERIC(12,2),
    parcelamento    VARCHAR(100),
    descricao       TEXT,
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CARACTERÍSTICAS
CREATE TABLE IF NOT EXISTS caracteristicas (
    id                      SERIAL PRIMARY KEY,
    produto_id              INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    modelo                  VARCHAR(255),
    largura                 VARCHAR(50),
    comprimento             VARCHAR(50),
    altura                  VARCHAR(50),
    outros                  TEXT,
    quantidade_assentos     VARCHAR(50),
    compartimento_livros    VARCHAR(50)
);

-- 6. CORES
CREATE TABLE IF NOT EXISTS cores (
    id          SERIAL PRIMARY KEY,
    produto_id  INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    nome        VARCHAR(100) NOT NULL,
    altura      VARCHAR(50),
    ordem       INTEGER NOT NULL DEFAULT 0
);

-- 7. IMAGENS
CREATE TABLE IF NOT EXISTS imagens (
    id          SERIAL PRIMARY KEY,
    produto_id  INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    cor_id      INTEGER REFERENCES cores(id) ON DELETE SET NULL,
    caminho     VARCHAR(500) NOT NULL,
    ordem       INTEGER NOT NULL DEFAULT 0
);

-- 8. PERGUNTAS E RESPOSTAS
CREATE TABLE IF NOT EXISTS perguntas (
    id              SERIAL PRIMARY KEY,
    produto_id      INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    pergunta        TEXT NOT NULL,
    resposta        TEXT,
    nome_cliente    VARCHAR(255),
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    respondida_em   TIMESTAMPTZ
);

-- 9. AVALIAÇÕES
CREATE TABLE IF NOT EXISTS avaliacoes (
    id                  SERIAL PRIMARY KEY,
    produto_id          INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    cliente             VARCHAR(255),
    nota                INTEGER CHECK (nota BETWEEN 1 AND 5),
    comentario          TEXT,
    resposta_vendedor   TEXT,
    criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. IMAGENS DE AVALIAÇÕES
CREATE TABLE IF NOT EXISTS avaliacao_imagens (
    id              SERIAL PRIMARY KEY,
    avaliacao_id    INTEGER NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
    caminho         VARCHAR(500) NOT NULL
);

-- ============================================================
-- SEED: CATEGORIAS INICIAIS
-- ============================================================
INSERT INTO categorias (nome, slug) VALUES
    ('Conjunto Escolar - Tampo ABS', 'conjunto-escolar-tampo-abs'),
    ('Conjunto Escolar - Tampo de Madeira', 'conjunto-escolar-tampo-madeira'),
    ('Refeitório', 'refeitorio'),
    ('Sextavada', 'sextavada'),
    ('Coletivo', 'coletivo'),
    ('Armários', 'armarios')
ON CONFLICT (slug) DO NOTHING;