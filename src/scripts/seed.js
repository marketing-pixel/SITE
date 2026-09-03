require('dotenv').config();
const pool = require('../config/db');

// Migra os produtos do array atual para o banco
// As categorias já foram criadas na migration 001
async function seedProdutos() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Mapeia os produtos atuais (do index.html original)
        // Ajuste os caminhos conforme sua estrutura de assets
        const produtos = [
            {
                titulo: 'Linha ABS — Porta-Copo',
                linha: 'Linha ABS',
                categoriaSlug: 'conjunto-escolar-tampo-abs',
                descricao: 'Conjuntos escolares desenvolvidos para proporcionar praticidade e funcionalidade no ambiente educacional, com tampo em ABS e recursos integrados para organização dos materiais.',
                cores: [
                    { nome: 'Azul', imagens: ['/assets/Móveis/ABS-PORTA-COPO/1-PC-Azul.png'] },
                    { nome: 'Verde', imagens: ['/assets/Móveis/ABS-PORTA-COPO/2-PC-Verde.png'] },
                    { nome: 'Vermelho', imagens: ['/assets/Móveis/ABS-PORTA-COPO/3-PC-Vermelho.png'] },
                    { nome: 'Amarelo', imagens: ['/assets/Móveis/ABS-PORTA-COPO/4-PC-Amarelo.png'] },
                    { nome: 'Laranja', imagens: ['/assets/Móveis/ABS-PORTA-COPO/5-PC-Laranja.png'] }
                ]
            },
            {
                titulo: 'Conjunto Escolar — Tampo de Madeira',
                linha: 'Conjunto Escolar',
                categoriaSlug: 'conjunto-escolar-tampo-madeira',
                descricao: 'Conjuntos escolares com tampo de madeira, desenvolvidos para atender às necessidades dos ambientes educacionais com praticidade, resistência e funcionalidade.',
                cores: []
            },
            {
                titulo: 'Refeitórios',
                linha: 'Ambientes Coletivos',
                categoriaSlug: 'refeitorio',
                descricao: 'Soluções para refeitórios escolares e institucionais, desenvolvidas para proporcionar organização e praticidade aos ambientes coletivos.',
                cores: []
            },
            {
                titulo: 'Linha Conj. Sextavada',
                linha: 'Linha Conj.',
                categoriaSlug: 'sextavada',
                descricao: 'Conjuntos sextavados desenvolvidos para ambientes escolares, proporcionando uma solução funcional para organização dos espaços e interação entre os usuários.',
                cores: []
            },
            {
                titulo: 'Linha Conj. Colet',
                linha: 'Linha Conj.',
                categoriaSlug: 'coletivo',
                descricao: 'Soluções para ambientes coletivos, desenvolvidas para atender diferentes necessidades de organização e utilização dos espaços.',
                cores: []
            },
            {
                titulo: 'Armários',
                linha: 'Armazenamento',
                categoriaSlug: 'armarios',
                descricao: 'Linha de armários para organização de ambientes escolares e institucionais, oferecendo soluções práticas para armazenamento e organização.',
                cores: []
            }
        ];

        for (const p of produtos) {
            // Busca categoria
            const cat = await client.query(
                'SELECT id FROM categorias WHERE slug = $1', [p.categoriaSlug]
            );
            if (cat.rows.length === 0) {
                console.log(`Categoria não encontrada para ${p.titulo}, pulando.`);
                continue;
            }
            const categoriaId = cat.rows[0].id;

            // Insere produto
            const produto = await client.query(
                `INSERT INTO produtos (titulo, linha, descricao, categoria_id)
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [p.titulo, p.linha, p.descricao, categoriaId]
            );
            const produtoId = produto.rows[0].id;

            // Insere características padrão
            await client.query(
                `INSERT INTO caracteristicas (produto_id, modelo) VALUES ($1, $2)`,
                [produtoId, p.titulo]
            );

            // Insere cores e imagens
            if (p.cores.length > 0) {
                for (let i = 0; i < p.cores.length; i++) {
                    const cor = p.cores[i];
                    const corResult = await client.query(
                        'INSERT INTO cores (produto_id, nome, ordem) VALUES ($1, $2, $3) RETURNING id',
                        [produtoId, cor.nome, i]
                    );
                    const corId = corResult.rows[0].id;
                    for (let j = 0; j < cor.imagens.length; j++) {
                        await client.query(
                            'INSERT INTO imagens (produto_id, cor_id, caminho, ordem) VALUES ($1, $2, $3, $4)',
                            [produtoId, corId, cor.imagens[j], j]
                        );
                    }
                }
            }

            console.log(`Produto inserido: ${p.titulo}`);
        }

        await client.query('COMMIT');
        console.log('Seed concluído com sucesso.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro no seed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedProdutos();