require('dotenv').config();
const bcrypt = require('bcrypt');
const readline = require('readline');
const pool = require('../config/db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(pergunta) {
    return new Promise(resolve => rl.question(pergunta, resolve));
}

async function criarAdmin() {
    const email = (await perguntar('E-mail do administrador: ')).trim().toLowerCase();
    const nome = (await perguntar('Nome do administrador: ')).trim();
    const senha = await perguntar('Senha do administrador: ');

    if (!email || !nome || !senha) {
        console.log('Todos os campos são obrigatórios.');
        rl.close();
        return;
    }
    if (senha.length < 8) {
        console.log('A senha deve ter no mínimo 8 caracteres.');
        rl.close();
        return;
    }

    try {
        // Gera hash com bcrypt (nunca armazena texto puro)
        const salt = await bcrypt.genSalt(12);
        const senhaHash = await bcrypt.hash(senha, salt);

        const result = await pool.query(
            `INSERT INTO admin (email, senha_hash, nome)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, nome = EXCLUDED.nome
             RETURNING id, email, nome`,
            [email, senhaHash, nome]
        );

        console.log('Administrador criado/atualizado com sucesso:');
        console.log(`  E-mail: ${result.rows[0].email}`);
        console.log(`  Nome: ${result.rows[0].nome}`);
        console.log('A senha foi armazenada como hash (bcrypt).');
    } catch (err) {
        console.error('Erro ao criar administrador:', err.message);
    } finally {
        rl.close();
        await pool.end();
    }
}

criarAdmin();