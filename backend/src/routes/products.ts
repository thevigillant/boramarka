import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { createAuditLog } from '../utils/auditLogger';

export default async function productRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ═══════════════════════════════════════════════════════════
  // Categorias de Produtos
  // ═══════════════════════════════════════════════════════════

  // GET /api/products/categories — List categories for admin
  app.get('/categories', async (request) => {
    const user = request.user as { id: number };
    return prisma.productCategory.findMany({
      where: { adminId: user.id },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  });

  // POST /api/products/categories — Create category
  app.post('/categories', async (request, reply) => {
    const user = request.user as { id: number };
    const { name, iconUrl } = request.body as { name: string; iconUrl?: string };

    if (!name || name.trim().length < 2) {
      return reply.status(400).send({ error: 'Nome da categoria é obrigatório (mín. 2 caracteres)' });
    }

    const count = await prisma.productCategory.count({ where: { adminId: user.id } });

    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        iconUrl: iconUrl || '',
        position: count,
        adminId: user.id,
      },
    });

    return reply.status(201).send(category);
  });

  // PUT /api/products/categories/:id — Update category
  app.put('/categories/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { name, iconUrl } = request.body as { name?: string; iconUrl?: string };

    const category = await prisma.productCategory.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!category) {
      return reply.status(404).send({ error: 'Categoria não encontrada' });
    }

    const updated = await prisma.productCategory.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(iconUrl !== undefined && { iconUrl }),
      },
    });

    return updated;
  });

  // DELETE /api/products/categories/:id — Delete category
  app.delete('/categories/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const category = await prisma.productCategory.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!category) {
      return reply.status(404).send({ error: 'Categoria não encontrada' });
    }

    await prisma.productCategory.delete({ where: { id: parseInt(id) } });
    return reply.status(204).send();
  });

  // ═══════════════════════════════════════════════════════════
  // Produtos / Itens de Encomenda
  // ═══════════════════════════════════════════════════════════

  // GET /api/products — List all products with photos and custom fields
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    return prisma.product.findMany({
      where: { adminId: user.id },
      include: {
        category: true,
        photos: { orderBy: { position: 'asc' } },
        customFields: { orderBy: { position: 'asc' } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  });

  // GET /api/products/:id — Get single product
  app.get('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const product = await prisma.product.findFirst({
      where: { id: parseInt(id), adminId: user.id },
      include: {
        category: true,
        photos: { orderBy: { position: 'asc' } },
        customFields: { orderBy: { position: 'asc' } },
      },
    });

    if (!product) {
      return reply.status(404).send({ error: 'Produto não encontrado' });
    }

    return product;
  });

  // POST /api/products — Create product
  app.post('/', async (request, reply) => {
    const user = request.user as { id: number };
    const {
      name,
      description,
      price,
      minDaysNotice,
      maxQuantityPerOrder,
      unitLabel,
      available,
      featured,
      categoryId,
      photos,
      customFields,
    } = request.body as {
      name: string;
      description?: string;
      price: number;
      minDaysNotice?: number;
      maxQuantityPerOrder?: number;
      unitLabel?: string;
      available?: boolean;
      featured?: boolean;
      categoryId?: number;
      photos?: string[]; // URLs de fotos
      customFields?: Array<{
        label: string;
        fieldType: 'TEXT' | 'SELECT' | 'CHECKBOX';
        options?: string[];
        required?: boolean;
      }>;
    };

    if (!name || name.trim().length < 2) {
      return reply.status(400).send({ error: 'Nome do produto é obrigatório (mín. 2 caracteres)' });
    }

    if (price === undefined || Number(price) < 0) {
      return reply.status(400).send({ error: 'Preço deve ser maior ou igual a zero' });
    }

    const count = await prisma.product.count({ where: { adminId: user.id } });

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          price: Number(price),
          minDaysNotice: minDaysNotice !== undefined ? Number(minDaysNotice) : 2,
          maxQuantityPerOrder: maxQuantityPerOrder !== undefined ? Number(maxQuantityPerOrder) : 99,
          unitLabel: unitLabel?.trim() || 'unidade',
          available: available !== undefined ? available : true,
          featured: featured !== undefined ? featured : false,
          position: count,
          categoryId: categoryId ? Number(categoryId) : null,
          adminId: user.id,
        },
      });

      // Cria fotos
      if (Array.isArray(photos) && photos.length > 0) {
        await tx.productPhoto.createMany({
          data: photos.map((url, index) => ({
            url,
            position: index,
            productId: p.id,
          })),
        });
      }

      // Cria campos customizados
      if (Array.isArray(customFields) && customFields.length > 0) {
        await tx.productCustomField.createMany({
          data: customFields.map((cf, index) => ({
            label: cf.label.trim(),
            fieldType: cf.fieldType || 'TEXT',
            options: JSON.stringify(cf.options || []),
            required: cf.required || false,
            position: index,
            productId: p.id,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: p.id },
        include: {
          category: true,
          photos: { orderBy: { position: 'asc' } },
          customFields: { orderBy: { position: 'asc' } },
        },
      });
    });

    await createAuditLog(request, {
      action: 'CREATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product!.id,
      details: `Cadastrou o produto de encomenda "${product!.name}" (R$ ${product!.price.toFixed(2)})`,
      adminId: user.id,
    });

    return reply.status(201).send(product);
  });

  // PUT /api/products/:id — Update product
  app.put('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const productId = parseInt(id);

    const existing = await prisma.product.findFirst({
      where: { id: productId, adminId: user.id },
    });

    if (!existing) {
      return reply.status(404).send({ error: 'Produto não encontrado' });
    }

    const {
      name,
      description,
      price,
      minDaysNotice,
      maxQuantityPerOrder,
      unitLabel,
      available,
      featured,
      categoryId,
      photos,
      customFields,
    } = request.body as {
      name?: string;
      description?: string;
      price?: number;
      minDaysNotice?: number;
      maxQuantityPerOrder?: number;
      unitLabel?: string;
      available?: boolean;
      featured?: boolean;
      categoryId?: number | null;
      photos?: string[];
      customFields?: Array<{
        label: string;
        fieldType: 'TEXT' | 'SELECT' | 'CHECKBOX';
        options?: string[];
        required?: boolean;
      }>;
    };

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: productId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(description !== undefined && { description: description.trim() }),
          ...(price !== undefined && { price: Number(price) }),
          ...(minDaysNotice !== undefined && { minDaysNotice: Number(minDaysNotice) }),
          ...(maxQuantityPerOrder !== undefined && { maxQuantityPerOrder: Number(maxQuantityPerOrder) }),
          ...(unitLabel !== undefined && { unitLabel: unitLabel.trim() }),
          ...(available !== undefined && { available }),
          ...(featured !== undefined && { featured }),
          ...(categoryId !== undefined && { categoryId: categoryId ? Number(categoryId) : null }),
        },
      });

      // Atualiza fotos se fornecidas
      if (Array.isArray(photos)) {
        await tx.productPhoto.deleteMany({ where: { productId } });
        if (photos.length > 0) {
          await tx.productPhoto.createMany({
            data: photos.map((url, index) => ({
              url,
              position: index,
              productId,
            })),
          });
        }
      }

      // Atualiza campos customizados se fornecidos
      if (Array.isArray(customFields)) {
        await tx.productCustomField.deleteMany({ where: { productId } });
        if (customFields.length > 0) {
          await tx.productCustomField.createMany({
            data: customFields.map((cf, index) => ({
              label: cf.label.trim(),
              fieldType: cf.fieldType || 'TEXT',
              options: JSON.stringify(cf.options || []),
              required: cf.required || false,
              position: index,
              productId,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          photos: { orderBy: { position: 'asc' } },
          customFields: { orderBy: { position: 'asc' } },
        },
      });
    });

    await createAuditLog(request, {
      action: 'UPDATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: productId,
      details: `Atualizou os dados do produto "${updated!.name}"`,
      adminId: user.id,
    });

    return updated;
  });

  // DELETE /api/products/:id — Delete product
  app.delete('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const productId = parseInt(id);

    const product = await prisma.product.findFirst({
      where: { id: productId, adminId: user.id },
    });

    if (!product) {
      return reply.status(404).send({ error: 'Produto não encontrado' });
    }

    await prisma.product.delete({ where: { id: productId } });

    await createAuditLog(request, {
      action: 'DELETE_PRODUCT',
      entity: 'PRODUCT',
      entityId: productId,
      details: `Excluiu o produto "${product.name}"`,
      adminId: user.id,
    });

    return reply.status(204).send();
  });

  // PATCH /api/products/reorder — Reorder products
  app.patch('/reorder', async (request, reply) => {
    const user = request.user as { id: number };
    const { productIds } = request.body as { productIds: number[] };

    if (!Array.isArray(productIds)) {
      return reply.status(400).send({ error: 'productIds deve ser um array de IDs' });
    }

    await prisma.$transaction(
      productIds.map((id, index) =>
        prisma.product.updateMany({
          where: { id, adminId: user.id },
          data: { position: index },
        })
      )
    );

    return { success: true };
  });
}
