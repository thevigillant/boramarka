import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { authenticate } from '../plugins/auth';
import { uploadImageBuffer } from '../utils/cloudinary';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export default async function uploadRoutes(app: FastifyInstance) {
  // Registra o plugin de multipart apenas nesta instância
  await app.register(multipart, {
    limits: { fileSize: MAX_FILE_SIZE },
  });

  /**
   * Salva imagem localmente no diretório uploads/<folder>
   */
  const saveLocally = async (
    buffer: Buffer,
    folder: string,
    mimeType: string,
    request: any
  ): Promise<{ url: string; publicId: string }> => {
    const ext = MIME_TO_EXT[mimeType] || 'jpg';
    const filename = `${Date.now()}-${uuidv4().substring(0, 8)}.${ext}`;
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const targetDir = path.join(process.cwd(), 'uploads', safeFolder);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Determina a URL base do backend (em produção ou local)
    const host = request.headers.host || 'localhost:3001';
    const protocol = request.protocol || (request.headers['x-forwarded-proto'] as string) || 'http';
    const configuredBackendUrl = process.env.BACKEND_URL || process.env.RAILWAY_STATIC_URL;
    const baseUrl = configuredBackendUrl
      ? configuredBackendUrl.replace(/\/+$/, '')
      : `${protocol}://${host}`;

    const url = `${baseUrl}/uploads/${safeFolder}/${filename}`;
    return { url, publicId: filename };
  };

  /**
   * POST /api/upload/image
   * Autenticado — faz upload de uma imagem (Cloudinary com fallback local transparente).
   * Body: multipart/form-data com campo "file" (imagem) e opcional "folder" (ex: "products", "services")
   * Retorna: { url: string, publicId?: string }
   */
  app.post('/image', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'Nenhum arquivo enviado' });
      }

      if (!ALLOWED_MIME.includes(data.mimetype.toLowerCase())) {
        return reply.status(400).send({
          error: 'Formato de imagem inválido. Use JPG, PNG, WebP ou GIF.',
        });
      }

      // Extrai a pasta (via query param ou campo do formulário)
      const queryFolder = (request.query as { folder?: string })?.folder;
      const fieldFolder = (data.fields as Record<string, { value?: string }>)?.folder?.value;
      const folder = (queryFolder || fieldFolder || 'products').trim();

      const buffer = await data.toBuffer();

      // 1. Verifica se o Cloudinary está devidamente configurado com chaves reais
      const cloudConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'seu_cloud_name' &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_KEY !== 'sua_api_key' &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.CLOUDINARY_API_SECRET !== 'seu_api_secret';

      if (cloudConfigured) {
        try {
          const result = await uploadImageBuffer(buffer, folder);
          return reply.send({
            url: result.url,
            publicId: result.publicId,
            storage: 'cloudinary',
          });
        } catch (cloudErr: any) {
          request.log.warn(
            { err: cloudErr?.message || cloudErr },
            'Falha no upload para Cloudinary — salvando localmente como fallback'
          );
          // Fallback para armazenamento local abaixo
        }
      }

      // 2. Armazenamento local robusto (desenvolvimento / fallback)
      const localResult = await saveLocally(buffer, folder, data.mimetype, request);
      return reply.send({
        url: localResult.url,
        publicId: localResult.publicId,
        storage: 'local',
      });
    } catch (err: any) {
      request.log.error(err, 'Erro no upload de imagem');
      return reply.status(500).send({ error: err.message || 'Erro ao processar imagem' });
    }
  });

  /**
   * POST /api/upload/base64
   * Autenticado — salva imagem enviada em base64 (DataURL)
   */
  app.post('/base64', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const { base64, folder = 'products' } = request.body as {
        base64: string;
        folder?: string;
      };

      if (!base64 || typeof base64 !== 'string') {
        return reply.status(400).send({ error: 'Conteúdo base64 inválido' });
      }

      const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!match) {
        return reply.status(400).send({ error: 'Data URI base64 inválido' });
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const cloudConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'seu_cloud_name' &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_KEY !== 'sua_api_key';

      if (cloudConfigured) {
        try {
          const result = await uploadImageBuffer(buffer, folder);
          return reply.send({ url: result.url, publicId: result.publicId, storage: 'cloudinary' });
        } catch {}
      }

      const localResult = await saveLocally(buffer, folder, mimeType, request);
      return reply.send({ url: localResult.url, publicId: localResult.publicId, storage: 'local' });
    } catch (err: any) {
      request.log.error(err, 'Erro ao processar upload base64');
      return reply.status(500).send({ error: err.message || 'Erro ao processar upload' });
    }
  });
}

