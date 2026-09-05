import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { createAuditLog } from '../utils/auditLogger';
import { parseSafeInt, createCategorySchema, updateCategorySchema, setProductRecipeSchema } from '../utils/validators';
import { cache } from '../utils/cache';
import { getRecipeForProduct, setRecipeForProduct, deleteRecipeItem } from '../services/bomService';

export default async function productRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ═══════════════════════════════════════════════════════════
  // Categorias de Produtos
  // ═══════════════════════════════════════════════════════════

  // GET /api/products/categories — List categories for admin (com cache 60s)
  app.get('/categories', async (request) => {
    const user = request.user as { id: number };
    const cacheKey = `categories:${user.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const categories = await prisma.productCategory.findMany({
      where: { adminId: user.id },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    cache.set(cacheKey, categories, 60);
    return categories;
  });

  // POST /api/products/categories — Create category
  app.post('/categories', async (request, reply) => {
    const user = request.user as { id: number };
    const validation = createCategorySchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.issues[0]?.message || 'Dados inválidos' });
    }

    const { name, iconUrl } = validation.data;
    const count = await prisma.productCategory.count({ where: { adminId: user.id } });

    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        iconUrl: iconUrl || '',
        position: count,
        adminId: user.id,
      },
    });

    cache.invalidate(`categories:${user.id}`);
    cache.invalidate('storefront');

    return reply.status(201).send(category);
  });

  // PUT /api/products/categories/:id — Update category
  app.put('/categories/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const categoryId = parseSafeInt((request.params as any)?.id);
    if (!categoryId) {
      return reply.status(400).send({ error: 'ID de categoria inválido' });
    }

    const validation = updateCategorySchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.issues[0]?.message || 'Dados inválidos' });
    }

    const { name, iconUrl } = validation.data;

    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, adminId: user.id },
    });

    if (!category) {
      return reply.status(404).send({ error: 'Categoria não encontrada' });
    }

    const updated = await prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        ...(name && { name: name.trim() }),
        ...(iconUrl !== undefined && { iconUrl }),
      },
    });

    cache.invalidate(`categories:${user.id}`);
    cache.invalidate('storefront');

    return updated;
  });

  // DELETE /api/products/categories/:id — Delete category
  app.delete('/categories/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const categoryId = parseSafeInt((request.params as any)?.id);
    if (!categoryId) {
      return reply.status(400).send({ error: 'ID de categoria inválido' });
    }

    const category = await prisma.productCategory.findFirst({
      where: { id: categoryId, adminId: user.id },
    });

    if (!category) {
      return reply.status(404).send({ error: 'Categoria não encontrada' });
    }

    await prisma.productCategory.delete({ where: { id: categoryId } });
    cache.invalidate(`categories:${user.id}`);
    cache.invalidate('storefront');
    return reply.status(204).send();
  });

  // ═══════════════════════════════════════════════════════════
  // Produtos / Itens de Encomenda
  // ═══════════════════════════════════════════════════════════

  // GET /api/products — List all products with photos and custom fields (suporta paginação opcional)
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    const { page, limit } = request.query as any || {};

    const pageNum = parseSafeInt(page);
    const limitNum = parseSafeInt(limit);

    if (pageNum || limitNum) {
      const p = pageNum || 1;
      const l = Math.min(limitNum || 20, 100);
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: { adminId: user.id },
          include: {
            category: true,
            photos: { orderBy: { position: 'asc' } },
            customFields: { orderBy: { position: 'asc' } },
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
          skip: (p - 1) * l,
          take: l,
        }),
        prisma.product.count({ where: { adminId: user.id } }),
      ]);
      return { data: products, total, page: p, limit: l };
    }

    return prisma.product.findMany({
      where: { adminId: user.id },
      include: {
        category: true,
        photos: { orderBy: { position: 'asc' } },
        customFields: { orderBy: { position: 'asc' } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
  });

  // GET /api/products/:id — Get single product
  app.get('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const productId = parseSafeInt((request.params as any)?.id);
    if (!productId) {
      return reply.status(400).send({ error: 'ID de produto inválido' });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, adminId: user.id },
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
        const validPhotos = photos
          .map((p: any) => (typeof p === 'string' ? p : p?.url))
          .filter((url: any) => typeof url === 'string' && url.trim().length > 0);

        if (validPhotos.length > 0) {
          await tx.productPhoto.createMany({
            data: validPhotos.map((url: string, index: number) => ({
              url: url.trim(),
              position: index,
              productId: p.id,
            })),
          });
        }
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

    cache.invalidate('storefront');
    return reply.status(201).send(product);
  });

  // PUT /api/products/:id — Update product
  app.put('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const productId = parseSafeInt((request.params as any)?.id);
    if (!productId) {
      return reply.status(400).send({ error: 'ID de produto inválido' });
    }

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
        const validPhotos = photos
          .map((p: any) => (typeof p === 'string' ? p : p?.url))
          .filter((url: any) => typeof url === 'string' && url.trim().length > 0);

        if (validPhotos.length > 0) {
          await tx.productPhoto.createMany({
            data: validPhotos.map((url: string, index: number) => ({
              url: url.trim(),
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

    cache.invalidate('storefront');
    return updated;
  });

  // DELETE /api/products/:id — Delete product
  app.delete('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const productId = parseSafeInt((request.params as any)?.id);
    if (!productId) {
      return reply.status(400).send({ error: 'ID de produto inválido' });
    }

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

    cache.invalidate('storefront');
    return reply.status(204).send();
  });

  // PATCH /api/products/reorder — Reorder products
  app.patch('/reorder', async (request, reply) => {
    const user = request.user as { id: number };
    const { productIds } = request.body as { productIds: number[] };

    if (!Array.isArray(productIds) || productIds.some(id => !parseSafeInt(id))) {
      return reply.status(400).send({ error: 'productIds deve ser um array de IDs numéricos válidos' });
    }

    await prisma.$transaction(
      productIds.map((id, index) =>
        prisma.product.updateMany({
          where: { id, adminId: user.id },
          data: { position: index },
        })
      )
    );

    cache.invalidate('storefront');
    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════
  // Ficha Técnica / BOM (Bill of Materials) do Produto
  // ═══════════════════════════════════════════════════════════

  // GET /api/products/:id/recipe — Consultar ficha técnica e margens
  app.get('/:id/recipe', async (request, reply) => {
    const user = request.user as { id: number };
    const productId = parseSafeInt((request.params as any)?.id);
    if (!productId) {
      return reply.status(400).send({ error: 'ID de produto inválido' });
    }

    const recipe = await getRecipeForProduct(productId, user.id);
    if (!recipe) {
      return reply.status(404).send({ error: 'Produto não encontrado' });
    }

    return recipe;
  });

  // PUT /api/products/:id/recipe — Salvar / atualizar ficha técnica completa
  app.put('/:id/recipe', async (request, reply) => {
    const user = request.user as { id: number };
    const productId = parseSafeInt((request.params as any)?.id);
    if (!productId) {
      return reply.status(400).send({ error: 'ID de produto inválido' });
    }

    const validation = setProductRecipeSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.issues[0]?.message || 'Dados inválidos' });
    }

    try {
      const updated = await setRecipeForProduct(productId, validation.data.items, user.id);
      await createAuditLog(request, {
        action: 'UPDATE_PRODUCT_RECIPE',
        entity: 'PRODUCT',
        entityId: productId,
        details: `Atualizou a ficha técnica do produto #${productId} com ${validation.data.items.length} insumo(s)`,
        adminId: user.id,
      });
      return updated;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Erro ao atualizar ficha técnica' });
    }
  });

  // DELETE /api/products/:id/recipe/:recipeItemId — Remover insumo da ficha técnica
  app.delete('/:id/recipe/:recipeItemId', async (request, reply) => {
    const user = request.user as { id: number };
    const productId = parseSafeInt((request.params as any)?.id);
    const recipeItemId = parseSafeInt((request.params as any)?.recipeItemId);
    if (!productId || !recipeItemId) {
      return reply.status(400).send({ error: 'IDs inválidos' });
    }

    const deleted = await deleteRecipeItem(productId, recipeItemId, user.id);
    if (!deleted) {
      return reply.status(404).send({ error: 'Insumo ou produto não encontrado' });
    }

    return reply.status(204).send();
  });
}
