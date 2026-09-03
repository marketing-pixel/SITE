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
    const { nome, slug } = req.body;
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