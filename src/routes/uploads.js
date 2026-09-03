const express = require('express');
const multer = require('multer');
const { autenticar } = require('../middleware/auth');
const { cloudinary, cloudinaryConfigurado } = require('../config/cloudinary');

const router = express.Router();
const MIMES_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];
const PASTAS_CLOUDINARY = {
    produto: 'cortez-moveis/produtos',
    cor: 'cortez-moveis/cores',
    avaliacao: 'cortez-moveis/avaliacoes'
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (MIMES_PERMITIDOS.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Formato de imagem não permitido. Use PNG, JPG ou WebP.'));
    }
});

function enviarParaCloudinary(file, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (erro, resultado) => erro ? reject(erro) : resolve(resultado)
        );
        stream.end(file.buffer);
    });
}

router.post('/', autenticar, (req, res) => {
    upload.single('imagem')(req, res, async err => {
        if (err instanceof multer.MulterError) {
            const erro = err.code === 'LIMIT_FILE_SIZE'
                ? 'Imagem deve ter no máximo 5MB.'
                : 'Erro no upload: ' + err.message;
            return res.status(400).json({ erro });
        }
        if (err) return res.status(400).json({ erro: err.message });
        if (!req.file) return res.status(400).json({ erro: 'Nenhuma imagem enviada.' });
        if (!cloudinaryConfigurado()) {
            return res.status(503).json({ erro: 'Armazenamento de imagens não configurado.' });
        }

        try {
            const tipo = ['cor', 'avaliacao'].includes(req.body.tipo)
                ? req.body.tipo
                : 'produto';
            const resultado = await enviarParaCloudinary(req.file, PASTAS_CLOUDINARY[tipo]);
            return res.status(201).json({
                caminho: resultado.secure_url,
                public_id: resultado.public_id
            });
        } catch (uploadError) {
            console.error('Erro ao enviar imagem ao Cloudinary:', uploadError);
            return res.status(502).json({ erro: 'Não foi possível enviar a imagem.' });
        }
    });
});

module.exports = router;
