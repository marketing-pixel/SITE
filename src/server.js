require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const produtosRoutes = require('./routes/produtos');
const categoriasRoutes = require('./routes/categorias');
const uploadsRoutes = require('./routes/uploads');
const imagensProxyRoutes = require('./routes/imagens-proxy');

// ============================================================
// AUTO-MIGRATE: garante que o banco tenha as colunas usadas
// pelo código. Todas as migrations são idempotentes
// (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS),
// então rodar a cada boot é seguro e rápido.
// ============================================================
const fs = require('fs');
const pool = require('./config/db');

async function rodarMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

    const client = await pool.connect();
    try {
        for (const file of files) {
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query(sql);
            console.log(`Migration ${file} OK`);
        }
    } catch (err) {
        console.error('Erro em migrations (site continua subindo):', err.message);
    } finally {
        client.release();
    }
}

const app = express();

// Segurança HTTP
app.use(helmet());

// CORS restrito por variável de ambiente (mesmo domínio = não é necessário)
// Se FRONTEND_URL estiver definido, permite apenas essa origem.
const frontendUrl = process.env.FRONTEND_URL;
if (frontendUrl) {
    app.use(cors({
        origin: frontendUrl,
        credentials: true
    }));
}
// Se não houver FRONTEND_URL, frontend e backend são o mesmo Express -> sem CORS aberto.

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/imagens', imagensProxyRoutes);

// Página do painel admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
rodarMigrations().finally(() => {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
});
