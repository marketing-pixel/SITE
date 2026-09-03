const crypto = require('crypto');
const pool = require('../config/db');

// Gera hash do token (SHA-256) - o token cru só existe no cookie
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Gera token aleatório seguro
function gerarToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Limpa sessões expiradas (inativa as que passaram da validade)
async function limparSessoesExpiradas() {
    try {
        await pool.query(
            'UPDATE sessoes SET ativa = FALSE WHERE expira_em <= NOW() AND ativa = TRUE'
        );
    } catch (err) {
        console.error('Erro ao limpar sessões expiradas:', err);
    }
}

// Middleware de autenticação - valida a sessão no banco
async function autenticar(req, res, next) {
    const token = req.cookies[process.env.SESSION_COOKIE_NAME || 'cortez_session'];
    if (!token) {
        return res.status(401).json({ erro: 'Não autenticado.' });
    }

    const tokenHash = hashToken(token);
    try {
        const result = await pool.query(
            `SELECT s.id AS sessao_id, s.admin_id, a.email, a.nome
             FROM sessoes s
             JOIN admin a ON a.id = s.admin_id
             WHERE s.token_hash = $1 AND s.ativa = TRUE AND s.expira_em > NOW()`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
        }

        req.admin = result.rows[0];
        req.tokenHash = tokenHash;
        next();
    } catch (err) {
        console.error('Erro na autenticação:', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
}

module.exports = { autenticar, hashToken, gerarToken, limparSessoesExpiradas };