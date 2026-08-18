import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { authenticate } from '../plugins/auth';
import { uploadImageBuffer } from '../utils/cloudinary';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default async function uploadRoutes(app: FastifyInstance) {
  // Registra o plugin de multipart apenas nesta instância
  await app.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE },
  });

  /**
   * POST /api/upload/image
   * Autenticado — faz upload de uma imagem para o Cloudinary.
   * Body: multipart/form-data com campo "file" (imagem) e "folder" (string: "services" | "products")
   * Retorna: { url: string }
   */
  app.post('/image', { onRequest: [authenticate] }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'Nenhum arquivo enviado' });
    }

    if (!ALLOWED_MIME.includes(data.mimetype)) {
      return reply.status(400).send({
        error: 'Formato inválido. Use JPG, PNG ou WebP',
      });
    }

    // Extrai o folder do campo do form (default: "general")
    const folder = (data.fields as Record<string, { value?: string }>)?.folder?.value || 'general';

    try {
      const buffer = await data.toBuffer();

      // Verifica se o Cloudinary está configurado
      const cloudConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'seu_cloud_name';

      if (!cloudConfigured) {
        // Modo de desenvolvimento: retorna uma URL placeholder
        return reply.send({
          url: `https://placehold.co/600x400/1a1a2e/ffffff?text=Cloudinary+nao+configurado`,
          warning: 'Configure as variáveis CLOUDINARY_* no .env para habilitar uploads reais',
        });
      }

      const result = await uploadImageBuffer(buffer, folder);

      return reply.send({ url: result.url, publicId: result.publicId });
    } catch (err) {
      request.log.error(err, 'Erro no upload de imagem');
      return reply.status(500).send({ error: 'Erro ao fazer upload da imagem' });
    }
  });
}
