// Proxy de imagens Cloudinary: serve as imagens pelo próprio domínio do site,
// evitando bloqueios de rede/antivírus/DNS no navegador do cliente.
const express = require('express');
const https = require('https');
const { cloudinary, cloudinaryConfigurado } = require('../config/cloudinary');

const router = express.Router();

// Cache em memória: public_id -> timestamp da última validação bem-sucedida
const cacheOk = new Map();
const TTL_OK = 10 * 60 * 1000; // 10 min

function servirCloudinary(publicId, res) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const url = 'https://res.cloudinary.com/' + cloudName + '/image/upload/' + publicId + '.png';
    https.get(url, (up) => {
        if (up.statusCode !== 200) {
            res.status(up.statusCode === 404 ? 404 : 502).end();
            return;
        }
        res.setHeader('Content-Type', up.headers['content-type'] || 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        up.pipe(res);
    }).on('error', () => res.status(502).end());
}

router.get('/cloudinary/*', (req, res) => {
    if (!cloudinaryConfigurado()) return res.status(503).end();
    // public_id = tudo depois de /api/imagens/cloudinary/
    let publicId = req.path.replace(/^\/cloudinary\//, '');
    if (!publicId || publicId.includes('..')) return res.status(400).end();
    // remove extensão se veio (cloudinary aceita com ou sem)
    publicId = publicId.replace(/\.(png|jpe?g|webp|gif)$/i, '');
    const agora = Date.now();
    const ultimo = cacheOk.get(publicId);
    if (ultimo && (agora - ultimo) < TTL_OK) {
        return servirCloudinary(publicId, res);
    }
    // valida existência com a API admin (leve) antes de servir
    cloudinary.api.resource(publicId, { resource_type: 'image' })
        .then(() => {
            cacheOk.set(publicId, agora);
            servirCloudinary(publicId, res);
        })
        .catch((err) => {
            // Se a validação falhar por config/limite, tenta servir direto mesmo assim
            if (err && err.http_code !== 404) {
                return servirCloudinary(publicId, res);
            }
            res.status(404).end();
        });
});

module.exports = router;
