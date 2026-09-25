const express = require('express');
const pool = require('../config/db');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

// GET /api/categorias - públicas
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nome, slug FROM categorias WHERE ativa = TRUE ORDER BY nome'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
});

// POST /api/categorias - protegida (admin)
router.post('/', autenticar, async (req, res) => {
    const nome = String(req.body?.nome || '').trim();
    const slug = String(req.body?.slug || '').trim();
    if (!nome || !slug) {
        return res.status(400).json({ erro: 'Nome e slug são obrigatórios.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO categorias (nome, slug) VALUES ($1, $2) RETURNING *',
            [nome, slug]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ erro: 'Categoria já existe.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
});

module.exports = router;
// PUT /api/categorias/:id - protegida (admin)
router.put('/:id', autenticar, async (req, res) => {
    const id = Number(req.params.id);
    const nome = String(req.body?.nome || '').trim();
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: 'ID inválido.' });
    }
    if (!nome) {
        return res.status(400).json({ erro: 'O nome da categoria é obrigatório.' });
    }
    if (nome.length > 120) {
        return res.status(400).json({ erro: 'O nome da categoria deve ter no máximo 120 caracteres.' });
    }
    try {
        const result = await pool.query(
            'UPDATE categorias SET nome = $1 WHERE id = $2 RETURNING id, nome, slug',
            [nome, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ erro: 'Já existe uma categoria com esse nome.' });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
});

// DELETE /api/categorias/:id - protegida (admin)
router.delete('/:id', autenticar, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ erro: 'ID inválido.' });
    }
    try {
        const produtos = await pool.query(
            'SELECT COUNT(*)::integer AS total FROM produtos WHERE categoria_id = $1',
            [id]
        );
        const total = Number(produtos.rows[0]?.total || 0);
        if (total > 0) {
            return res.status(409).json({
                erro: 'Não é possível excluir esta categoria enquanto houver produtos vinculados a ela. Mova ou exclua os produtos primeiro.'
            });
        }

        const result = await pool.query(
            'DELETE FROM categorias WHERE id = $1 RETURNING id, nome',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada.' });
        }
        res.json({ ok: true, categoria: result.rows[0] });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(409).json({
                erro: 'Não é possível excluir esta categoria porque existem registros vinculados a ela.'
            });
        }
        console.error(err);
        res.status(500).json({ erro: 'Erro interno.' });
    }
});
