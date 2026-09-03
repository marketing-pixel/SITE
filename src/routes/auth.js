const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const { autenticar, hashToken, gerarToken, limparSessoesExpiradas } = require('../middleware/auth');

const router = express.Router();

// Rate limit no login - proteção contra força bruta
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máx. 5 tentativas por IP
    message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Configuração do cookie
function configurarCookie(res, token) {
    const dias = Number(process.env.SESSION_DAYS) || 7;
    const segundos = dias * 24 * 60 * 60;
    res.cookie(process.env.SESSION_COOKIE_NAME || 'cortez_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: segundos * 1000,
        path: '/'
    });
}

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
    const { email, senha } = req.body || {};

    // Validação das entradas
    if (!email || typeof email !== 'string' || !senha || typeof senha !== 'string') {
        return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }
    if (email.length > 255 || senha.length > 200) {
        return res.status(400).json({ erro: 'Dados inválidos.' });
    }

    try {
        // Limpa sessões expiradas antes de criar nova
        await limparSessoesExpiradas();

        const result = await pool.query(
            'SELECT id, email, senha_hash, nome FROM admin WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        const admin = result.rows[0];
        const senhaOk = await bcrypt.compare(senha, admin.senha_hash);
        if (!senhaOk) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        // Cria sessão
        const token = gerarToken();
        const tokenHash = hashToken(token);
        const dias = Number(process.env.SESSION_DAYS) || 7;

        await pool.query(
            `INSERT INTO sessoes (admin_id, token_hash, expira_em)
             VALUES ($1, $2, NOW() + ($3 || ' days')::interval)`,
            [admin.id, tokenHash, dias]
        );

        configurarCookie(res, token);
        res.json({ ok: true, nome: admin.nome, email: admin.email });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
});

// POST /api/auth/logout - invalida a sessão no banco
router.post('/logout', async (req, res) => {
    const token = req.cookies[process.env.SESSION_COOKIE_NAME || 'cortez_session'];
    if (token) {
        const tokenHash = hashToken(token);
        try {
            await pool.query('UPDATE sessoes SET ativa = FALSE WHERE token_hash = $1', [tokenHash]);
        } catch (err) {
            console.error('Erro no logout:', err);
        }
    }
    res.clearCookie(process.env.SESSION_COOKIE_NAME || 'cortez_session', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
    });
    res.json({ ok: true });
});

// GET /api/auth/me - verifica sessão atual
router.get('/me', autenticar, (req, res) => {
    res.json({ admin: req.admin });
});

module.exports = router;