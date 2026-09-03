// ============================================================
// ESTADO E ROTAS DE PRODUTOS
// ============================================================

const express = require('express');
const pool = require('../config/db');
const { autenticar } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();


// ============================================================
// HELPERS
// ============================================================

function normalizarTexto(valor, max = null) {

    if (
        valor === undefined ||
        valor === null
    ) {
        return null;
    }

    const texto =
        String(valor).trim();

    if (!texto) {
        return null;
    }

    if (
        max &&
        texto.length > max
    ) {
        return texto.slice(
            0,
            max
        );
    }

    return texto;
}


function validarId(valor) {

    const id =
        Number(valor);

    return Number.isInteger(id) &&
        id > 0
        ? id
        : null;
}


function validarPreco(valor) {

    if (
        valor === undefined ||
        valor === null ||
        valor === ''
    ) {

        return {
            valido: true,
            valor: null
        };
    }

    const numero =
        Number(valor);

    if (
        !Number.isFinite(numero) ||
        numero < 0
    ) {

        return {
            valido: false,
            valor: null
        };
    }

    return {
        valido: true,
        valor: numero
    };
}


function validarNota(valor) {

    const nota =
        Number(valor);

    return Number.isInteger(nota) &&
        nota >= 1 &&
        nota <= 5
        ? nota
        : null;
}


function normalizarImagensAvaliacao(imagens) {

    if (!Array.isArray(imagens)) {
        return [];
    }

    const resultado = [];

    for (const imagem of imagens) {

        let caminho = null;

        if (
            typeof imagem === 'string'
        ) {

            caminho =
                normalizarTexto(
                    imagem,
                    500
                );

        } else if (
            imagem &&
            typeof imagem === 'object'
        ) {

            caminho =
                normalizarTexto(
                    imagem.caminho,
                    500
                );
        }

        if (!caminho) {
            continue;
        }

        /*
         * Somente caminhos internos do site.
         */
        if (
            !caminho.startsWith('/uploads/') &&
            !caminho.startsWith('/assets/')
        ) {
            continue;
        }

        resultado.push(
            caminho
        );
    }

    return resultado;
}


// ============================================================
// REMOVER ARQUIVO FÍSICO SE NÃO ESTIVER EM USO
// ============================================================

async function removerArquivoSeNaoUsado(caminho) {

    if (
        !caminho ||
        typeof caminho !== 'string' ||
        !caminho.startsWith('/uploads/')
    ) {
        return;
    }

    try {

        const imagensProduto =
            await pool.query(
                `SELECT COUNT(*) AS total
                 FROM imagens
                 WHERE caminho = $1`,
                [caminho]
            );


        if (
            Number(
                imagensProduto.rows[0].total
            ) !== 0
        ) {
            return;
        }


        const imagensAvaliacao =
            await pool.query(
                `SELECT COUNT(*) AS total
                 FROM avaliacao_imagens
                 WHERE caminho = $1`,
                [caminho]
            );


        if (
            Number(
                imagensAvaliacao.rows[0].total
            ) !== 0
        ) {
            return;
        }


        const filePath =
            path.resolve(
                path.join(
                    __dirname,
                    '..',
                    '..',
                    caminho
                )
            );


        const uploadsRoot =
            path.resolve(
                path.join(
                    __dirname,
                    '..',
                    '..',
                    'uploads'
                )
            );


        if (
            filePath !== uploadsRoot &&
            !filePath.startsWith(
                uploadsRoot + path.sep
            )
        ) {
            return;
        }


        if (
            fs.existsSync(
                filePath
            )
        ) {

            fs.unlinkSync(
                filePath
            );
        }

    } catch (err) {

        console.error(
            'Erro ao remover arquivo:',
            err
        );
    }
}


// ============================================================
// BUSCAR PRODUTO COMPLETO
// ============================================================

async function buscarProdutoCompleto(id) {

    const produto =
        await pool.query(
            `SELECT
                p.*,
                c.nome AS categoria_nome,
                c.slug AS categoria_slug
             FROM produtos p
             JOIN categorias c
               ON c.id = p.categoria_id
             WHERE p.id = $1`,
            [id]
        );


    if (
        produto.rows.length === 0
    ) {
        return null;
    }


    const p =
        produto.rows[0];


    // ========================================================
    // CORES
    // ========================================================

    const cores =
        await pool.query(
            `SELECT
                id,
                nome,
                altura,
                descricao,
                ordem
             FROM cores
             WHERE produto_id = $1
             ORDER BY ordem ASC, id ASC`,
            [id]
        );


    // ========================================================
    // IMAGENS
    // ========================================================

    const imagens =
        await pool.query(
            `SELECT
                id,
                cor_id,
                caminho,
                ordem,
                principal
             FROM imagens
             WHERE produto_id = $1
             ORDER BY
                CASE
                    WHEN principal = TRUE THEN 0
                    ELSE 1
                END,
                ordem ASC,
                id ASC`,
            [id]
        );


    // ========================================================
    // CARACTERÍSTICAS
    // ========================================================

    const caracteristicas =
        await pool.query(
            `SELECT
                id,
                produto_id,
                modelo,
                largura,
                comprimento,
                altura,
                outros,
                quantidade_assentos,
                compartimento_livros
             FROM caracteristicas
             WHERE produto_id = $1
             LIMIT 1`,
            [id]
        );


    return {
        ...p,

        cores:
            cores.rows,

        imagens:
            imagens.rows,

        caracteristicas:
            caracteristicas.rows[0] || null
    };
}


// ============================================================
// BUSCAR RESUMO DE AVALIAÇÕES
// ============================================================

async function buscarResumoAvaliacoes(produtoId) {

    const resumo =
        await pool.query(
            `SELECT
                COUNT(*)::integer AS total,
                COALESCE(
                    ROUND(
                        AVG(nota)::numeric,
                        1
                    ),
                    0
                ) AS media
             FROM avaliacoes
             WHERE produto_id = $1`,
            [produtoId]
        );


    const distribuicao =
        await pool.query(
            `SELECT
                nota,
                COUNT(*)::integer AS quantidade
             FROM avaliacoes
             WHERE produto_id = $1
             GROUP BY nota
             ORDER BY nota DESC`,
            [produtoId]
        );


    const distribuicaoCompleta = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
    };


    distribuicao.rows.forEach(
        item => {

            distribuicaoCompleta[
                Number(item.nota)
            ] =
                Number(
                    item.quantidade
                );
        }
    );


    return {
        total:
            Number(
                resumo.rows[0].total
            ),

        media:
            Number(
                resumo.rows[0].media
            ),

        distribuicao:
            distribuicaoCompleta
    };
}


// ============================================================
// BUSCAR AVALIAÇÕES
// ============================================================

async function buscarAvaliacoes(
    produtoId,
    limite = 50,
    offset = 0
) {

    const avaliacoes =
        await pool.query(
            `SELECT
                a.id,
                a.produto_id,
                a.cliente,
                a.nota,
                a.comentario,
                a.resposta_vendedor,
                a.criado_em
             FROM avaliacoes a
             WHERE a.produto_id = $1
             ORDER BY
                a.criado_em DESC,
                a.id DESC
             LIMIT $2
             OFFSET $3`,
            [
                produtoId,
                limite,
                offset
            ]
        );


    if (
        avaliacoes.rows.length === 0
    ) {
        return [];
    }


    const ids =
        avaliacoes.rows.map(
            avaliacao =>
                avaliacao.id
        );


    const imagens =
        await pool.query(
            `SELECT
                id,
                avaliacao_id,
                caminho
             FROM avaliacao_imagens
             WHERE avaliacao_id = ANY($1::integer[])
             ORDER BY
                avaliacao_id ASC,
                id ASC`,
            [ids]
        );


    const imagensPorAvaliacao =
        new Map();


    imagens.rows.forEach(
        imagem => {

            if (
                !imagensPorAvaliacao.has(
                    imagem.avaliacao_id
                )
            ) {

                imagensPorAvaliacao.set(
                    imagem.avaliacao_id,
                    []
                );
            }


            imagensPorAvaliacao
                .get(
                    imagem.avaliacao_id
                )
                .push(
                    imagem
                );
        }
    );


    return avaliacoes.rows.map(
        avaliacao => ({
            ...avaliacao,

            imagens:
                imagensPorAvaliacao.get(
                    avaliacao.id
                ) || []
        })
    );
}


// ============================================================
// BUSCAR PERGUNTAS
// ============================================================

async function buscarPerguntas(
    produtoId,
    limite = 100,
    offset = 0
) {

    const result =
        await pool.query(
            `SELECT
                id,
                produto_id,
                pergunta,
                resposta,
                nome_cliente,
                criado_em,
                respondida_em
             FROM perguntas
             WHERE produto_id = $1
             ORDER BY
                criado_em DESC,
                id DESC
             LIMIT $2
             OFFSET $3`,
            [
                produtoId,
                limite,
                offset
            ]
        );


    return result.rows;
}


// ============================================================
// NORMALIZAR IMAGENS RECEBIDAS
// ============================================================

function normalizarImagensRecebidas(imagens) {

    if (!Array.isArray(imagens)) {
        return [];
    }

    const resultado = [];

    for (
        const imagem of imagens
    ) {

        if (
            !imagem ||
            typeof imagem !== 'object'
        ) {
            continue;
        }

        const caminho =
            normalizarTexto(
                imagem.caminho,
                500
            );

        if (!caminho) {
            continue;
        }

        /*
         * Aceita apenas caminhos do site.
         */
        if (
            !caminho.startsWith('/uploads/') &&
            !caminho.startsWith('/assets/')
        ) {
            continue;
        }

        resultado.push({
            caminho,
            principal:
                imagem.principal === true
        });
    }

    return resultado;
}


// ============================================================
// PREPARAR IMAGENS
// ============================================================

function prepararImagens(imagens) {

    if (!Array.isArray(imagens)) {
        return [];
    }

    let principalEncontrada =
        false;

    const resultado =
        imagens.map(
            imagem => {

                let principal =
                    false;

                if (
                    !principalEncontrada &&
                    imagem.principal === true
                ) {

                    principal =
                        true;

                    principalEncontrada =
                        true;
                }

                return {
                    caminho:
                        imagem.caminho,

                    principal
                };
            }
        );


    /*
     * Se nenhuma imagem foi marcada,
     * a primeira será principal.
     */

    if (
        !principalEncontrada &&
        resultado.length > 0
    ) {

        resultado[0].principal =
            true;
    }

    return resultado;
}


// ============================================================
// GARANTIR IMAGEM PRINCIPAL
// ============================================================

async function garantirImagemPrincipal(
    client,
    produtoId
) {

    const principal =
        await client.query(
            `SELECT id
             FROM imagens
             WHERE produto_id = $1
               AND principal = TRUE
             LIMIT 1`,
            [produtoId]
        );


    if (
        principal.rows.length > 0
    ) {
        return;
    }


    await client.query(
        `UPDATE imagens
         SET principal = TRUE
         WHERE id = (
             SELECT id
             FROM imagens
             WHERE produto_id = $1
             ORDER BY ordem ASC, id ASC
             LIMIT 1
         )`,
        [produtoId]
    );
}


// ============================================================
// GARANTIR SOMENTE UMA IMAGEM PRINCIPAL
// ============================================================

async function garantirSomenteUmaPrincipal(
    client,
    produtoId
) {

    await client.query(
        `WITH primeira AS (
            SELECT id
            FROM imagens
            WHERE produto_id = $1
            ORDER BY
                CASE
                    WHEN principal = TRUE THEN 0
                    ELSE 1
                END,
                ordem ASC,
                id ASC
            LIMIT 1
        )
        UPDATE imagens
        SET principal = (
            id = (
                SELECT id
                FROM primeira
            )
        )
        WHERE produto_id = $1`,
        [produtoId]
    );
}


// ============================================================
// ROTAS PÚBLICAS
// ============================================================


// ============================================================
// GET /api/produtos
// LISTA PRODUTOS ATIVOS
// ============================================================

router.get(
    '/',
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `SELECT
                        p.id,
                        p.titulo,
                        p.linha,
                        p.preco,
                        p.parcelamento,
                        p.descricao,
                        p.categoria_id,

                        c.nome AS categoria_nome,
                        c.slug AS categoria_slug,

                        (
                            SELECT i.caminho
                            FROM imagens i
                            WHERE i.produto_id = p.id
                            ORDER BY
                                CASE
                                    WHEN i.principal = TRUE THEN 0
                                    ELSE 1
                                END,
                                i.ordem ASC,
                                i.id ASC
                            LIMIT 1
                        ) AS imagem_principal

                     FROM produtos p

                     JOIN categorias c
                       ON c.id = p.categoria_id

                     WHERE p.ativo = TRUE
                       AND c.ativa = TRUE

                     ORDER BY p.id ASC`
                );


            res.json(
                result.rows
            );

        } catch (err) {

            console.error(
                'Erro ao listar produtos:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao carregar os produtos.'
            });
        }
    }
);


// ============================================================
// GET /api/produtos/admin/todos
// LISTA TODOS OS PRODUTOS PARA ADMIN
// ============================================================

router.get(
    '/admin/todos',
    autenticar,
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `SELECT
                        p.id,
                        p.titulo,
                        p.linha,
                        p.preco,
                        p.parcelamento,
                        p.descricao,
                        p.ativo,
                        p.categoria_id,

                        c.nome AS categoria_nome,

                        (
                            SELECT i.caminho
                            FROM imagens i
                            WHERE i.produto_id = p.id
                            ORDER BY
                                CASE
                                    WHEN i.principal = TRUE THEN 0
                                    ELSE 1
                                END,
                                i.ordem ASC,
                                i.id ASC
                            LIMIT 1
                        ) AS imagem_principal

                     FROM produtos p

                     JOIN categorias c
                       ON c.id = p.categoria_id

                     ORDER BY p.id ASC`
                );


            res.json(
                result.rows
            );

        } catch (err) {

            console.error(
                'Erro ao listar produtos administrativos:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao carregar os produtos.'
            });
        }
    }
);


// ============================================================
// GET /api/produtos/:id/avaliacoes
// LISTA AVALIAÇÕES DO PRODUTO
// ============================================================

router.get(
    '/:id/avaliacoes',
    async (req, res) => {

        const id =
            validarId(
                req.params.id
            );


        if (!id) {

            return res.status(400).json({
                erro:
                    'ID inválido.'
            });
        }


        try {

            const produto =
                await pool.query(
                    `SELECT id
                     FROM produtos
                     WHERE id = $1
                       AND ativo = TRUE`,
                    [id]
                );


            if (
                produto.rows.length === 0
            ) {

                return res.status(404).json({
                    erro:
                        'Produto não encontrado.'
                });
            }


            const resumo =
                await buscarResumoAvaliacoes(
                    id
                );


            const limiteRecebido =
                Number(
                    req.query.limite
                );


            const offsetRecebido =
                Number(
                    req.query.offset
                );


            const limite =
                Number.isInteger(
                    limiteRecebido
                ) &&
                limiteRecebido > 0 &&
                limiteRecebido <= 100
                    ? limiteRecebido
                    : 50;


            const offset =
                Number.isInteger(
                    offsetRecebido
                ) &&
                offsetRecebido >= 0
                    ? offsetRecebido
                    : 0;


            const avaliacoes =
                await buscarAvaliacoes(
                    id,
                    limite,
                    offset
                );


            res.json({
                resumo,
                avaliacoes
            });

        } catch (err) {

            console.error(
                'Erro ao buscar avaliações:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao carregar as avaliações.'
            });
        }
    }
);


// ============================================================
// POST /api/produtos/:id/avaliacoes
// CRIAR AVALIAÇÃO
// ============================================================

router.post(
    '/:id/avaliacoes',
    async (req, res) => {

        const produtoId =
            validarId(
                req.params.id
            );


        if (!produtoId) {

            return res.status(400).json({
                erro:
                    'ID do produto inválido.'
            });
        }


        const body =
            req.body || {};


        const cliente =
            normalizarTexto(
                body.cliente,
                255
            ) || 'Cliente';


        const nota =
            validarNota(
                body.nota
            );


        const comentario =
            normalizarTexto(
                body.comentario,
                5000
            );


        const imagens =
            normalizarImagensAvaliacao(
                body.imagens
            );


        if (!nota) {

            return res.status(400).json({
                erro:
                    'A quantidade de estrelas é obrigatória e deve ser de 1 a 5.'
            });
        }


        /*
         * A avaliação pode ter:
         *
         * - somente comentário;
         * - somente imagem;
         * - comentário + imagem.
         *
         * Mas não pode ser enviada somente com estrelas.
         */

        if (
            !comentario &&
            imagens.length === 0
        ) {

            return res.status(400).json({
                erro:
                    'Informe um comentário ou envie pelo menos uma foto.'
            });
        }


        const produto =
            await pool.query(
                `SELECT id
                 FROM produtos
                 WHERE id = $1
                   AND ativo = TRUE`,
                [produtoId]
            );


        if (
            produto.rows.length === 0
        ) {

            return res.status(404).json({
                erro:
                    'Produto não encontrado.'
            });
        }


        const client =
            await pool.connect();


        try {

            await client.query(
                'BEGIN'
            );


            const avaliacao =
                await client.query(
                    `INSERT INTO avaliacoes
                        (
                            produto_id,
                            cliente,
                            nota,
                            comentario,
                            resposta_vendedor
                        )
                     VALUES
                        ($1, $2, $3, $4, $5)
                     RETURNING
                        id,
                        produto_id,
                        cliente,
                        nota,
                        comentario,
                        resposta_vendedor,
                        criado_em`,
                    [
                        produtoId,
                        cliente,
                        nota,
                        comentario,
                        null
                    ]
                );


            const avaliacaoId =
                avaliacao.rows[0].id;


            for (
                const caminho of imagens
            ) {

                await client.query(
                    `INSERT INTO avaliacao_imagens
                        (
                            avaliacao_id,
                            caminho
                        )
                     VALUES
                        ($1, $2)`,
                    [
                        avaliacaoId,
                        caminho
                    ]
                );
            }


            await client.query(
                'COMMIT'
            );


            const avaliacaoCompleta =
                await buscarAvaliacoes(
                    produtoId,
                    50,
                    0
                );


            const resumo =
                await buscarResumoAvaliacoes(
                    produtoId
                );


            const criada =
                avaliacaoCompleta.find(
                    item =>
                        Number(
                            item.id
                        ) ===
                        Number(
                            avaliacaoId
                        )
                ) ||
                avaliacao.rows[0];


            res.status(201).json({
                ok: true,
                avaliacao:
                    criada,
                resumo
            });

        } catch (err) {

            try {

                await client.query(
                    'ROLLBACK'
                );

            } catch (rollbackErr) {

                console.error(
                    'Erro no rollback:',
                    rollbackErr
                );
            }


            console.error(
                'Erro ao criar avaliação:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao salvar a avaliação.'
            });

        } finally {

            client.release();
        }
    }
);


// ============================================================
// GET /api/produtos/:id/perguntas
// LISTA PERGUNTAS DO PRODUTO
// ============================================================

router.get(
    '/:id/perguntas',
    async (req, res) => {

        const id =
            validarId(
                req.params.id
            );


        if (!id) {

            return res.status(400).json({
                erro:
                    'ID inválido.'
            });
        }


        try {

            const produto =
                await pool.query(
                    `SELECT id
                     FROM produtos
                     WHERE id = $1
                       AND ativo = TRUE`,
                    [id]
                );


            if (
                produto.rows.length === 0
            ) {

                return res.status(404).json({
                    erro:
                        'Produto não encontrado.'
                });
            }


            const limiteRecebido =
                Number(
                    req.query.limite
                );


            const offsetRecebido =
                Number(
                    req.query.offset
                );


            const limite =
                Number.isInteger(
                    limiteRecebido
                ) &&
                limiteRecebido > 0 &&
                limiteRecebido <= 100
                    ? limiteRecebido
                    : 100;


            const offset =
                Number.isInteger(
                    offsetRecebido
                ) &&
                offsetRecebido >= 0
                    ? offsetRecebido
                    : 0;


            const perguntas =
                await buscarPerguntas(
                    id,
                    limite,
                    offset
                );


            const total =
                await pool.query(
                    `SELECT COUNT(*)::integer AS total
                     FROM perguntas
                     WHERE produto_id = $1`,
                    [id]
                );


            res.json({
                total:
                    Number(
                        total.rows[0].total
                    ),

                perguntas
            });

        } catch (err) {

            console.error(
                'Erro ao buscar perguntas:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao carregar as perguntas.'
            });
        }
    }
);


// ============================================================
// POST /api/produtos/:id/perguntas
// CRIAR PERGUNTA
// ============================================================

router.post(
    '/:id/perguntas',
    async (req, res) => {

        const produtoId =
            validarId(
                req.params.id
            );


        if (!produtoId) {

            return res.status(400).json({
                erro:
                    'ID do produto inválido.'
            });
        }


        const body =
            req.body || {};


        const pergunta =
            normalizarTexto(
                body.pergunta,
                2000
            );


        const nomeCliente =
            normalizarTexto(
                body.nome_cliente ??
                body.nome ??
                body.cliente,
                255
            ) || 'Cliente';


        if (!pergunta) {

            return res.status(400).json({
                erro:
                    'Digite uma pergunta.'
            });
        }


        const produto =
            await pool.query(
                `SELECT id
                 FROM produtos
                 WHERE id = $1
                   AND ativo = TRUE`,
                [produtoId]
            );


        if (
            produto.rows.length === 0
        ) {

            return res.status(404).json({
                erro:
                    'Produto não encontrado.'
            });
        }


        try {

            const result =
                await pool.query(
                    `INSERT INTO perguntas
                        (
                            produto_id,
                            pergunta,
                            resposta,
                            nome_cliente,
                            criado_em,
                            respondida_em
                        )
                     VALUES
                        ($1, $2, $3, $4, NOW(), $5)
                     RETURNING
                        id,
                        produto_id,
                        pergunta,
                        resposta,
                        nome_cliente,
                        criado_em,
                        respondida_em`,
                    [
                        produtoId,
                        pergunta,
                        null,
                        nomeCliente,
                        null
                    ]
                );


            res.status(201).json({
                ok: true,
                pergunta:
                    result.rows[0]
            });

        } catch (err) {

            console.error(
                'Erro ao criar pergunta:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao salvar a pergunta.'
            });
        }
    }
);


// ============================================================
// RESPONDER PERGUNTA
// ============================================================

async function responderPergunta(
    req,
    res
) {

    const produtoId =
        validarId(
            req.params.id
        );


    const perguntaId =
        validarId(
            req.params.perguntaId
        );


    if (
        !produtoId ||
        !perguntaId
    ) {

        return res.status(400).json({
            erro:
                'ID do produto ou da pergunta inválido.'
        });
    }


    const resposta =
        normalizarTexto(
            req.body &&
            req.body.resposta,
            5000
        );


    if (!resposta) {

        return res.status(400).json({
            erro:
                'Digite uma resposta.'
        });
    }


    try {

        const produto =
            await pool.query(
                `SELECT id
                 FROM produtos
                 WHERE id = $1`,
                [produtoId]
            );


        if (
            produto.rows.length === 0
        ) {

            return res.status(404).json({
                erro:
                    'Produto não encontrado.'
            });
        }


        const pergunta =
            await pool.query(
                `UPDATE perguntas
                 SET
                    resposta = $1,
                    respondida_em = NOW()
                 WHERE
                    id = $2
                    AND produto_id = $3
                 RETURNING
                    id,
                    produto_id,
                    pergunta,
                    resposta,
                    nome_cliente,
                    criado_em,
                    respondida_em`,
                [
                    resposta,
                    perguntaId,
                    produtoId
                ]
            );


        if (
            pergunta.rows.length === 0
        ) {

            return res.status(404).json({
                erro:
                    'Pergunta não encontrada para este produto.'
            });
        }


        return res.status(200).json({
            ok: true,

            pergunta:
                pergunta.rows[0]
        });

    } catch (err) {

        console.error(
            'Erro ao responder pergunta:',
            err
        );


        return res.status(500).json({
            erro:
                'Erro interno ao responder a pergunta.'
        });
    }
}


// ============================================================
// PUT /api/produtos/:id/perguntas/:perguntaId/responder
// RESPONDER PERGUNTA — ADMIN
// ============================================================

router.put(
    '/:id/perguntas/:perguntaId/responder',
    autenticar,
    responderPergunta
);


// ============================================================
// GET /api/produtos/:id
// DETALHE DO PRODUTO
// ============================================================

router.get(
    '/:id',
    async (req, res) => {

        const id =
            validarId(
                req.params.id
            );


        if (!id) {

            return res.status(400).json({
                erro:
                    'ID inválido.'
            });
        }


        try {

            const produto =
                await buscarProdutoCompleto(
                    id
                );


            if (
                !produto ||
                !produto.ativo
            ) {

                return res.status(404).json({
                    erro:
                        'Produto não encontrado.'
                });
            }


            // =================================================
            // PRODUTOS RELACIONADOS
            // =================================================

            const relacionados =
                await pool.query(
                    `SELECT
                        p.id,
                        p.titulo,
                        p.linha,
                        p.preco,
                        p.parcelamento,

                        (
                            SELECT i.caminho
                            FROM imagens i
                            WHERE i.produto_id = p.id
                            ORDER BY
                                CASE
                                    WHEN i.principal = TRUE THEN 0
                                    ELSE 1
                                END,
                                i.ordem ASC,
                                i.id ASC
                            LIMIT 1
                        ) AS imagem_principal

                     FROM produtos p

                     JOIN categorias c
                       ON c.id = p.categoria_id

                     WHERE p.categoria_id = $1
                       AND p.id != $2
                       AND p.ativo = TRUE
                       AND c.ativa = TRUE

                     ORDER BY p.id ASC

                     LIMIT 6`,
                    [
                        produto.categoria_id,
                        id
                    ]
                );


            // =================================================
            // RESUMO DE AVALIAÇÕES
            // =================================================

            const resumoAvaliacoes =
                await buscarResumoAvaliacoes(
                    id
                );


            // =================================================
            // AVALIAÇÕES RECENTES
            // =================================================

            const avaliacoes =
                await buscarAvaliacoes(
                    id,
                    10,
                    0
                );


            // =================================================
            // PERGUNTAS RECENTES
            // =================================================

            const perguntas =
                await buscarPerguntas(
                    id,
                    10,
                    0
                );


            const totalPerguntas =
                await pool.query(
                    `SELECT COUNT(*)::integer AS total
                     FROM perguntas
                     WHERE produto_id = $1`,
                    [id]
                );


            /*
             * Cada objeto de produto.cores contém:
             *
             * - id
             * - nome
             * - altura
             * - descricao
             * - ordem
             *
             * Portanto o frontend pode utilizar:
             *
             * produto.cores[0].descricao
             */

            res.json({

                ...produto,

                relacionados:
                    relacionados.rows,

                avaliacao_resumo:
                    resumoAvaliacoes,

                avaliacoes,

                perguntas,

                total_perguntas:
                    Number(
                        totalPerguntas.rows[0].total
                    )
            });

        } catch (err) {

            console.error(
                'Erro ao buscar produto:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao carregar o produto.'
            });
        }
    }
);


// ============================================================
// POST /api/produtos
// CRIAR PRODUTO
// ============================================================

router.post(
    '/',
    autenticar,
    async (req, res) => {

        const body =
            req.body || {};


        const titulo =
            normalizarTexto(
                body.titulo,
                255
            );


        const linha =
            normalizarTexto(
                body.linha,
                255
            );


        const parcelamento =
            normalizarTexto(
                body.parcelamento,
                100
            );


        const descricao =
            normalizarTexto(
                body.descricao,
                10000
            );


        const categoriaId =
            validarId(
                body.categoria_id
            );


        const caracteristicas =
            body.caracteristicas &&
            typeof body.caracteristicas === 'object'
                ? body.caracteristicas
                : null;


        const cores =
            Array.isArray(
                body.cores
            )
                ? body.cores
                : [];


        // =====================================================
        // VALIDAÇÕES
        // =====================================================

        if (!titulo) {

            return res.status(400).json({
                erro:
                    'Título é obrigatório.'
            });
        }


        if (
            titulo.length > 255
        ) {

            return res.status(400).json({
                erro:
                    'O título deve ter no máximo 255 caracteres.'
            });
        }


        if (!categoriaId) {

            return res.status(400).json({
                erro:
                    'Categoria é obrigatória.'
            });
        }


        const precoValidado =
            validarPreco(
                body.preco
            );


        if (
            !precoValidado.valido
        ) {

            return res.status(400).json({
                erro:
                    'Preço inválido.'
            });
        }


        const client =
            await pool.connect();


        try {

            await client.query(
                'BEGIN'
            );


            // =================================================
            // CATEGORIA
            // =================================================

            const categoria =
                await client.query(
                    `SELECT id
                     FROM categorias
                     WHERE id = $1
                       AND ativa = TRUE`,
                    [categoriaId]
                );


            if (
                categoria.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );


                return res.status(400).json({
                    erro:
                        'Categoria inválida ou inativa.'
                });
            }


            // =================================================
            // PRODUTO
            // =================================================

            const produto =
                await client.query(
                    `INSERT INTO produtos
                        (
                            titulo,
                            linha,
                            preco,
                            parcelamento,
                            descricao,
                            categoria_id
                        )
                     VALUES
                        ($1, $2, $3, $4, $5, $6)
                     RETURNING *`,
                    [
                        titulo,
                        linha,
                        precoValidado.valor,
                        parcelamento,
                        descricao,
                        categoriaId
                    ]
                );


            const produtoId =
                produto.rows[0].id;


            // =================================================
            // CARACTERÍSTICAS
            // =================================================

            if (
                caracteristicas
            ) {

                await client.query(
                    `INSERT INTO caracteristicas
                        (
                            produto_id,
                            modelo,
                            largura,
                            comprimento,
                            altura,
                            outros,
                            quantidade_assentos,
                            compartimento_livros
                        )
                     VALUES
                        ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        produtoId,

                        normalizarTexto(
                            caracteristicas.modelo
                        ),

                        normalizarTexto(
                            caracteristicas.largura
                        ),

                        normalizarTexto(
                            caracteristicas.comprimento
                        ),

                        normalizarTexto(
                            caracteristicas.altura
                        ),

                        normalizarTexto(
                            caracteristicas.outros
                        ),

                        normalizarTexto(
                            caracteristicas.quantidadeAssentos
                        ),

                        normalizarTexto(
                            caracteristicas.compartimentoLivros
                        )
                    ]
                );
            }


            // =================================================
            // CORES + IMAGENS
            // =================================================

            for (
                let i = 0;
                i < cores.length;
                i++
            ) {

                const cor =
                    cores[i];


                if (
                    !cor ||
                    typeof cor !== 'object'
                ) {
                    continue;
                }


                const nomeCor =
                    normalizarTexto(
                        cor.nome,
                        100
                    ) || 'Padrão';


                const altura =
                    normalizarTexto(
                        cor.altura,
                        50
                    );


                const descricaoCor =
                    normalizarTexto(
                        cor.descricao,
                        10000
                    );


                const corResult =
                    await client.query(
                        `INSERT INTO cores
                            (
                                produto_id,
                                nome,
                                altura,
                                descricao,
                                ordem
                            )
                         VALUES
                            ($1, $2, $3, $4, $5)
                         RETURNING id`,
                        [
                            produtoId,
                            nomeCor,
                            altura,
                            descricaoCor,
                            i
                        ]
                    );


                const corId =
                    corResult.rows[0].id;


                const imagensRecebidas =
                    prepararImagens(
                        normalizarImagensRecebidas(
                            cor.imagens
                        )
                    );


                for (
                    let j = 0;
                    j < imagensRecebidas.length;
                    j++
                ) {

                    const imagem =
                        imagensRecebidas[j];


                    await client.query(
                        `INSERT INTO imagens
                            (
                                produto_id,
                                cor_id,
                                caminho,
                                ordem,
                                principal
                            )
                         VALUES
                            ($1, $2, $3, $4, $5)`,
                        [
                            produtoId,
                            corId,
                            imagem.caminho,
                            j,
                            imagem.principal
                        ]
                    );
                }
            }


            // =================================================
            // GARANTE UMA PRINCIPAL
            // =================================================

            await garantirImagemPrincipal(
                client,
                produtoId
            );


            await garantirSomenteUmaPrincipal(
                client,
                produtoId
            );


            await client.query(
                'COMMIT'
            );


            const completo =
                await buscarProdutoCompleto(
                    produtoId
                );


            res.status(201).json(
                completo
            );

        } catch (err) {

            try {

                await client.query(
                    'ROLLBACK'
                );

            } catch (rollbackErr) {

                console.error(
                    'Erro no rollback:',
                    rollbackErr
                );
            }


            console.error(
                'Erro ao criar produto:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao criar o produto.'
            });

        } finally {

            client.release();
        }
    }
);


// ============================================================
// PUT /api/produtos/:id
// EDITAR PRODUTO
// ============================================================

router.put(
    '/:id',
    autenticar,
    async (req, res) => {

        const id =
            validarId(
                req.params.id
            );


        if (!id) {

            return res.status(400).json({
                erro:
                    'ID inválido.'
            });
        }


        const body =
            req.body || {};


        const titulo =
            body.titulo !== undefined
                ? normalizarTexto(
                    body.titulo,
                    255
                )
                : undefined;


        const linha =
            body.linha !== undefined
                ? normalizarTexto(
                    body.linha,
                    255
                )
                : undefined;


        const parcelamento =
            body.parcelamento !== undefined
                ? normalizarTexto(
                    body.parcelamento,
                    100
                )
                : undefined;


        const descricao =
            body.descricao !== undefined
                ? normalizarTexto(
                    body.descricao,
                    10000
                )
                : undefined;


        const categoriaId =
            body.categoria_id !== undefined &&
            body.categoria_id !== null &&
            body.categoria_id !== ''
                ? validarId(
                    body.categoria_id
                )
                : undefined;


        const caracteristicas =
            body.caracteristicas !== undefined &&
            body.caracteristicas !== null &&
            typeof body.caracteristicas === 'object'
                ? body.caracteristicas
                : undefined;


        const cores =
            body.cores !== undefined
                ? (
                    Array.isArray(
                        body.cores
                    )
                        ? body.cores
                        : null
                )
                : undefined;


        if (
            titulo !== undefined &&
            !titulo
        ) {

            return res.status(400).json({
                erro:
                    'Título não pode ficar vazio.'
            });
        }


        const precoValidado =
            validarPreco(
                body.preco
            );


        if (
            !precoValidado.valido
        ) {

            return res.status(400).json({
                erro:
                    'Preço inválido.'
            });
        }


        const client =
            await pool.connect();


        const caminhosAntigos =
            [];


        try {

            await client.query(
                'BEGIN'
            );


            // =================================================
            // VERIFICA PRODUTO
            // =================================================

            const existente =
                await client.query(
                    `SELECT id
                     FROM produtos
                     WHERE id = $1`,
                    [id]
                );


            if (
                existente.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );


                return res.status(404).json({
                    erro:
                        'Produto não encontrado.'
                });
            }


            // =================================================
            // CATEGORIA
            // =================================================

            if (
                categoriaId !== undefined
            ) {

                if (!categoriaId) {

                    await client.query(
                        'ROLLBACK'
                    );


                    return res.status(400).json({
                        erro:
                            'Categoria inválida.'
                    });
                }


                const categoria =
                    await client.query(
                        `SELECT id
                         FROM categorias
                         WHERE id = $1
                           AND ativa = TRUE`,
                        [categoriaId]
                    );


                if (
                    categoria.rows.length === 0
                ) {

                    await client.query(
                        'ROLLBACK'
                    );


                    return res.status(400).json({
                        erro:
                            'Categoria inválida ou inativa.'
                    });
                }
            }


            // =================================================
            // ATUALIZA PRODUTO
            // =================================================

            await client.query(
                `UPDATE produtos
                 SET
                    titulo = COALESCE($1, titulo),
                    linha = COALESCE($2, linha),
                    preco = CASE
                        WHEN $3::numeric IS NULL
                            THEN preco
                        ELSE $3::numeric
                    END,
                    parcelamento = COALESCE($4, parcelamento),
                    descricao = COALESCE($5, descricao),
                    categoria_id = COALESCE($6, categoria_id),
                    atualizado_em = NOW()
                 WHERE id = $7`,
                [
                    titulo !== undefined
                        ? titulo
                        : null,

                    linha !== undefined
                        ? linha
                        : null,

                    precoValidado.valor,

                    parcelamento !== undefined
                        ? parcelamento
                        : null,

                    descricao !== undefined
                        ? descricao
                        : null,

                    categoriaId !== undefined
                        ? categoriaId
                        : null,

                    id
                ]
            );


            // =================================================
            // CARACTERÍSTICAS
            // =================================================

            if (
                caracteristicas !== undefined
            ) {

                const valores = [

                    normalizarTexto(
                        caracteristicas.modelo
                    ),

                    normalizarTexto(
                        caracteristicas.largura
                    ),

                    normalizarTexto(
                        caracteristicas.comprimento
                    ),

                    normalizarTexto(
                        caracteristicas.altura
                    ),

                    normalizarTexto(
                        caracteristicas.outros
                    ),

                    normalizarTexto(
                        caracteristicas.quantidadeAssentos
                    ),

                    normalizarTexto(
                        caracteristicas.compartimentoLivros
                    )
                ];


                const existenteCaracteristicas =
                    await client.query(
                        `SELECT id
                         FROM caracteristicas
                         WHERE produto_id = $1`,
                        [id]
                    );


                if (
                    existenteCaracteristicas.rows.length > 0
                ) {

                    await client.query(
                        `UPDATE caracteristicas
                         SET
                            modelo = $2,
                            largura = $3,
                            comprimento = $4,
                            altura = $5,
                            outros = $6,
                            quantidade_assentos = $7,
                            compartimento_livros = $8
                         WHERE produto_id = $1`,
                        [
                            id,
                            ...valores
                        ]
                    );

                } else {

                    await client.query(
                        `INSERT INTO caracteristicas
                            (
                                produto_id,
                                modelo,
                                largura,
                                comprimento,
                                altura,
                                outros,
                                quantidade_assentos,
                                compartimento_livros
                            )
                         VALUES
                            ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            id,
                            ...valores
                        ]
                    );
                }
            }


            // =================================================
            // CORES + IMAGENS
            // =================================================

            if (
                cores !== undefined
            ) {

                if (!Array.isArray(cores)) {

                    await client.query(
                        'ROLLBACK'
                    );


                    return res.status(400).json({
                        erro:
                            'Formato de cores inválido.'
                    });
                }


                // ---------------------------------------------
                // GUARDA IMAGENS ANTIGAS
                // ---------------------------------------------

                const imagensAntigas =
                    await client.query(
                        `SELECT caminho
                         FROM imagens
                         WHERE produto_id = $1`,
                        [id]
                    );


                caminhosAntigos.push(
                    ...imagensAntigas.rows.map(
                        imagem =>
                            imagem.caminho
                    )
                );


                // ---------------------------------------------
                // REMOVE CORES
                // ---------------------------------------------

                await client.query(
                    `DELETE FROM cores
                     WHERE produto_id = $1`,
                    [id]
                );


                // ---------------------------------------------
                // RECRIA CORES
                // ---------------------------------------------

                for (
                    let i = 0;
                    i < cores.length;
                    i++
                ) {

                    const cor =
                        cores[i];


                    if (
                        !cor ||
                        typeof cor !== 'object'
                    ) {
                        continue;
                    }


                    const nomeCor =
                        normalizarTexto(
                            cor.nome,
                            100
                        ) || 'Padrão';


                    const altura =
                        normalizarTexto(
                            cor.altura,
                            50
                        );


                    const descricaoCor =
                        normalizarTexto(
                            cor.descricao,
                            10000
                        );


                    const corResult =
                        await client.query(
                            `INSERT INTO cores
                                (
                                    produto_id,
                                    nome,
                                    altura,
                                    descricao,
                                    ordem
                                )
                             VALUES
                                ($1, $2, $3, $4, $5)
                             RETURNING id`,
                            [
                                id,
                                nomeCor,
                                altura,
                                descricaoCor,
                                i
                            ]
                        );


                    const corId =
                        corResult.rows[0].id;


                    // -----------------------------------------
                    // IMAGENS DA COR
                    // -----------------------------------------

                    const imagensRecebidas =
                        prepararImagens(
                            normalizarImagensRecebidas(
                                cor.imagens
                            )
                        );


                    for (
                        let j = 0;
                        j < imagensRecebidas.length;
                        j++
                    ) {

                        const imagem =
                            imagensRecebidas[j];


                        await client.query(
                            `INSERT INTO imagens
                                (
                                    produto_id,
                                    cor_id,
                                    caminho,
                                    ordem,
                                    principal
                                )
                             VALUES
                                ($1, $2, $3, $4, $5)`,
                            [
                                id,
                                corId,
                                imagem.caminho,
                                j,
                                imagem.principal
                            ]
                        );
                    }
                }


                // ---------------------------------------------
                // GARANTE UMA ÚNICA PRINCIPAL
                // ---------------------------------------------

                await garantirImagemPrincipal(
                    client,
                    id
                );


                await garantirSomenteUmaPrincipal(
                    client,
                    id
                );
            }


            await client.query(
                'COMMIT'
            );


            // =================================================
            // REMOVE ARQUIVOS ANTIGOS
            // =================================================

            for (
                const caminho of caminhosAntigos
            ) {

                await removerArquivoSeNaoUsado(
                    caminho
                );
            }


            // =================================================
            // BUSCA PRODUTO ATUALIZADO
            // =================================================

            const completo =
                await buscarProdutoCompleto(
                    id
                );


            res.json(
                completo
            );

        } catch (err) {

            try {

                await client.query(
                    'ROLLBACK'
                );

            } catch (rollbackErr) {

                console.error(
                    'Erro no rollback:',
                    rollbackErr
                );
            }


            console.error(
                'Erro ao editar produto:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno ao editar o produto.'
            });

        } finally {

            client.release();
        }
    }
);


// ============================================================
// DELETE /api/produtos/:id
// DESATIVAÇÃO LÓGICA
// ============================================================

router.delete(
    '/:id',
    autenticar,
    async (req, res) => {

        const id =
            validarId(
                req.params.id
            );


        if (!id) {

            return res.status(400).json({
                erro:
                    'ID inválido.'
            });
        }


        try {

            const result =
                await pool.query(
                    `UPDATE produtos
                     SET
                        ativo = FALSE,
                        atualizado_em = NOW()
                     WHERE id = $1
                     RETURNING id`,
                    [id]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    erro:
                        'Produto não encontrado.'
                });
            }


            res.json({
                ok: true,
                mensagem:
                    'Produto desativado.'
            });

        } catch (err) {

            console.error(
                'Erro ao desativar produto:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno.'
            });
        }
    }
);


// ============================================================
// PUT /api/produtos/:id/reativar
// ============================================================

router.put(
    '/:id/reativar',
    autenticar,
    async (req, res) => {

        const id =
            validarId(
                req.params.id
            );


        if (!id) {

            return res.status(400).json({
                erro:
                    'ID inválido.'
            });
        }


        try {

            const result =
                await pool.query(
                    `UPDATE produtos
                     SET
                        ativo = TRUE,
                        atualizado_em = NOW()
                     WHERE id = $1
                     RETURNING id`,
                    [id]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({
                    erro:
                        'Produto não encontrado.'
                });
            }


            res.json({
                ok: true,
                mensagem:
                    'Produto reativado.'
            });

        } catch (err) {

            console.error(
                'Erro ao reativar produto:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno.'
            });
        }
    }
);


// ============================================================
// DELETE /api/produtos/:id/imagens/:imagemId
// REMOVER IMAGEM ESPECÍFICA
// ============================================================

router.delete(
    '/:id/imagens/:imagemId',
    autenticar,
    async (req, res) => {

        const produtoId =
            validarId(
                req.params.id
            );


        const imagemId =
            validarId(
                req.params.imagemId
            );


        if (
            !produtoId ||
            !imagemId
        ) {

            return res.status(400).json({
                erro:
                    'ID inválido.'
            });
        }


        const client =
            await pool.connect();


        try {

            await client.query(
                'BEGIN'
            );


            const img =
                await client.query(
                    `SELECT
                        id,
                        caminho,
                        principal
                     FROM imagens
                     WHERE id = $1
                       AND produto_id = $2`,
                    [
                        imagemId,
                        produtoId
                    ]
                );


            if (
                img.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );


                return res.status(404).json({
                    erro:
                        'Imagem não encontrada.'
                });
            }


            const caminho =
                img.rows[0].caminho;


            const eraPrincipal =
                img.rows[0].principal;


            await client.query(
                `DELETE FROM imagens
                 WHERE id = $1
                   AND produto_id = $2`,
                [
                    imagemId,
                    produtoId
                ]
            );


            if (
                eraPrincipal
            ) {

                await garantirImagemPrincipal(
                    client,
                    produtoId
                );


                await garantirSomenteUmaPrincipal(
                    client,
                    produtoId
                );
            }


            await client.query(
                'COMMIT'
            );


            await removerArquivoSeNaoUsado(
                caminho
            );


            res.json({
                ok: true,
                mensagem:
                    'Imagem removida.'
            });

        } catch (err) {

            try {

                await client.query(
                    'ROLLBACK'
                );

            } catch (rollbackErr) {

                console.error(
                    'Erro no rollback:',
                    rollbackErr
                );
            }


            console.error(
                'Erro ao remover imagem:',
                err
            );


            res.status(500).json({
                erro:
                    'Erro interno.'
            });

        } finally {

            client.release();
        }
    }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;