require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function executarMigrations() {
    const client = await pool.connect();
    try {
        console.log('Verificando conexão com o banco...');
        await client.query('SELECT 1');
        console.log('Conexão OK. Banco acessível.');

        const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`Encontradas ${files.length} migration(s).`);

        for (const file of files) {
            console.log(`Executando ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await client.query(sql);
            console.log(`Migration ${file} executada com sucesso.`);
        }

        console.log('Todas as migrations foram executadas.');
    } catch (err) {
        console.error('Erro ao executar migrations:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

executarMigrations();