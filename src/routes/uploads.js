const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

// Garante que as pastas de upload existam
const pastaProdutos = path.join(__dirname, '..', '..', 'uploads', 'produtos');
const pastaCores = path.join(__dirname, '..', '..', 'uploads', 'cores');
fs.mkdirSync(pastaProdutos, { recursive: true });
fs.mkdirSync(pastaCores, { recursive: true });

// Tipos MIME permitidos (validação real, não só extensão)
const MIMES_PERMITIDOS = [
    'image/png',
    'image/jpeg',
    'image/webp'
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tipo = req.body.tipo === 'cor' ? 'cores' : 'produtos';
        cb(null, path.join(__dirname, '..', '..', 'uploads', tipo));
    },
    filename: (req, file, cb) => {
        // Define extensão a partir do MIME, nunca do nome do arquivo
        const extMap = {
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/webp': '.webp'
        };
        const ext = extMap[file.mimetype] || '.png';
        const nome = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
        cb(null, nome);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        // Valida o MIME type real, não apenas a extensão
        if (MIMES_PERMITIDOS.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de imagem não permitido. Use PNG, JPG ou WebP.'));
        }
    }
});

// POST /api/uploads - protegida (admin)
router.post('/', autenticar, (req, res) => {
    upload.single('imagem')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ erro: 'Imagem deve ter no máximo 5MB.' });
            }
            return res.status(400).json({ erro: 'Erro no upload: ' + err.message });
        }
        if (err) {
            return res.status(400).json({ erro: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
        }
        const tipo = req.body.tipo === 'cor' ? 'cores' : 'produtos';
        const caminho = `/uploads/${tipo}/${req.file.filename}`;
        res.status(201).json({ caminho });
    });
});

module.exports = router;