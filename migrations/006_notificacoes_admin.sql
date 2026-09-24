-- Notificações persistentes para novas perguntas e avaliações.
CREATE TABLE IF NOT EXISTS admin_notificacoes (
    id              SERIAL PRIMARY KEY,
    tipo            VARCHAR(30) NOT NULL CHECK (tipo IN ('pergunta', 'avaliacao')),
    produto_id      INTEGER REFERENCES produtos(id) ON DELETE CASCADE,
    referencia_id   INTEGER NOT NULL,
    lida            BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notificacoes_lida_criado
    ON admin_notificacoes (lida, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notificacoes_produto
    ON admin_notificacoes (produto_id, criado_em DESC);