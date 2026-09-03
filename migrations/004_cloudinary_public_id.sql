-- Preserva imagens legadas em /uploads e registra o ativo Cloudinary de novos uploads.
ALTER TABLE imagens ADD COLUMN IF NOT EXISTS public_id VARCHAR(500);
ALTER TABLE avaliacao_imagens ADD COLUMN IF NOT EXISTS public_id VARCHAR(500);
