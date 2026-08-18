import { v2 as cloudinary } from 'cloudinary';

// Configura o Cloudinary com as variáveis de ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Faz upload de um buffer de imagem para o Cloudinary.
 * @param buffer Buffer da imagem
 * @param folder Pasta no Cloudinary (ex: "services", "products")
 * @param publicId ID público opcional (para sobrescrever)
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder: `boramarka/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    };

    if (publicId) {
      options.public_id = publicId;
      options.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        return reject(error || new Error('Upload falhou'));
      }
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    });

    uploadStream.end(buffer);
  });
}

/**
 * Remove uma imagem do Cloudinary pelo publicId
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
