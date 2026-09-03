const express = require('express');
const multer = require('multer');
const { autenticar } = require('../middleware/auth');
const { cloudinary, cloudinaryConfigurado } = require('../config/cloudinary');

const router = express.Router();
const LIMITE_UPLOAD = 5 * 1024 * 1024;
const TIMEOUT_CLOUDINARY_MS = 30000;
const MIMES_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];
const PASTAS_CLOUDINARY = {
    produto: 'cortez-moveis/produtos',
    cor: 'cortez-moveis/cores',
    avaliacao: 'cortez-moveis/avaliacoes'
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: LIMITE_UPLOAD },
    fileFilter: (req, file, cb) => {
        if (MIMES_PERMITIDOS.includes(file.mimetype)) {
            cb(null, true);
            return;
        }

        cb(new Error('Formato de imagem não permitido. Use PNG, JPG ou WebP.'));
    }
});

function tipoRealImagem(buffer) {
    if (!Buffer.isBuffer(buffer)) return null;

    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        )
    ) return 'image/png';

    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) return 'image/jpeg';

    if (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) return 'image/webp';

    return null;
}

function enviarParaCloudinary(file, folder) {
    return new Promise((resolve, reject) => {
        let finalizado = false;
        let stream;

        const finalizar = (erro, resultado) => {
            if (finalizado) return;
            finalizado = true;
            clearTimeout(timeout);

            if (erro) reject(erro);
            else resolve(resultado);
        };

        const timeout = setTimeout(() => {
            const erro = new Error('Tempo limite ao enviar imagem ao Cloudinary.');
            erro.code = 'CLOUDINARY_TIMEOUT';
            if (stream) stream.destroy(erro);
            finalizar(erro);
        }, TIMEOUT_CLOUDINARY_MS);

        try {
            stream = cloudinary.uploader.upload_stream(
                { folder, resource_type: 'image' },
                finalizar
            );
            stream.once('error', erro => finalizar(erro));
            stream.end(file.buffer);
        } catch (erro) {
            finalizar(erro);
        }
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

        const tipoReal = tipoRealImagem(req.file.buffer);
        if (!tipoReal || tipoReal !== req.file.mimetype) {
            return res.status(400).json({
                erro: 'O conteúdo do arquivo não corresponde a uma imagem PNG, JPG ou WebP válida.'
            });
        }

        if (!cloudinaryConfigurado()) {
            return res.status(503).json({ erro: 'Armazenamento de imagens não configurado.' });
        }

        try {
            const tipoRecebido = req.body && req.body.tipo;
            const tipo = ['cor', 'avaliacao'].includes(tipoRecebido)
                ? tipoRecebido
                : 'produto';
            const resultado = await enviarParaCloudinary(req.file, PASTAS_CLOUDINARY[tipo]);

            return res.status(201).json({
                caminho: resultado.secure_url,
                public_id: resultado.public_id
            });
        } catch (uploadError) {
            console.error('Erro ao enviar imagem ao Cloudinary:', uploadError);
            const status = uploadError.code === 'CLOUDINARY_TIMEOUT' ? 504 : 502;
            return res.status(status).json({ erro: 'Não foi possível enviar a imagem.' });
        }
    });
});

module.exports = router;
