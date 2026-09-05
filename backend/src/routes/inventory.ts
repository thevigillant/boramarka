import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import {
  parseSafeInt,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  inventoryMovementSchema,
} from '../utils/validators';

export default async function inventoryRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ── GET /api/inventory — Listar itens do estoque (suporta paginação opcional) ──
  app.get('/', async (request: FastifyRequest) => {
    const user = request.user as { id: number };
    const { page, limit } = request.query as any || {};

    const pageNum = parseSafeInt(page);
    const limitNum = parseSafeInt(limit);

    if (pageNum || limitNum) {
      const p = pageNum || 1;
      const l = Math.min(limitNum || 20, 100);
      const [items, total] = await Promise.all([
        prisma.inventoryItem.findMany({
          where: { adminId: user.id, active: true },
          include: {
            movements: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
          orderBy: { name: 'asc' },
          skip: (p - 1) * l,
          take: l,
        }),
        prisma.inventoryItem.count({ where: { adminId: user.id, active: true } }),
      ]);
      return {
        data: items.map(item => ({
          ...item,
          lowStock: item.quantity <= item.minQuantity,
        })),
        total,
        page: p,
        limit: l,
      };
    }

    const items = await prisma.inventoryItem.findMany({
      where: { adminId: user.id, active: true },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { name: 'asc' },
      take: 200,
    });

    return items.map(item => ({
      ...item,
      lowStock: item.quantity <= item.minQuantity,
    }));
  });

  // ── POST /api/inventory — Criar item ──────────────────────────────────
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const validation = createInventoryItemSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.issues[0]?.message || 'Dados inválidos' });
    }

    const { name, description, category, unit, costPrice, salePrice, quantity, minQuantity, photoUrl } = validation.data;

    const item = await prisma.inventoryItem.create({
      data: {
        adminId: user.id,
        name: name.trim(),
        description: description?.trim() || '',
        category: category || 'PRODUTO',
        unit: unit || 'unidade',
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        quantity: Number(quantity) || 0,
        minQuantity: Number(minQuantity) || 5,
        photoUrl: photoUrl || '',
      },
    });

    // Registra entrada inicial se tiver estoque
    if (item.quantity > 0) {
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: 'ENTRADA',
          quantity: item.quantity,
          reason: 'Estoque inicial',
        },
      });
    }

    return reply.status(201).send(item);
  });

  // ── PATCH /api/inventory/:id — Atualizar item ─────────────────────────
  app.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const itemId = parseSafeInt((request.params as any)?.id);
    if (!itemId) {
      return reply.status(400).send({ error: 'ID de item inválido' });
    }

    const validation = updateInventoryItemSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.issues[0]?.message || 'Dados inválidos' });
    }

    const body = validation.data;

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, adminId: user.id },
    });
    if (!item) return reply.status(404).send({ error: 'Item não encontrado.' });

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.costPrice !== undefined && { costPrice: Number(body.costPrice) }),
        ...(body.salePrice !== undefined && { salePrice: Number(body.salePrice) }),
        ...(body.minQuantity !== undefined && { minQuantity: Number(body.minQuantity) }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
      },
    });

    return updated;
  });

  // ── POST /api/inventory/:id/movement — Registrar movimentação ─────────
  app.post('/:id/movement', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const itemId = parseSafeInt((request.params as any)?.id);
    if (!itemId) {
      return reply.status(400).send({ error: 'ID de item inválido' });
    }

    const validation = inventoryMovementSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.issues[0]?.message || 'Dados de movimentação inválidos' });
    }

    const { type, quantity, reason, unitCost } = validation.data;

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, adminId: user.id },
    });
    if (!item) return reply.status(404).send({ error: 'Item não encontrado.' });

    const qty = Number(quantity);
    let newQty = item.quantity;
    let newCostPrice = item.costPrice;

    if (type === 'ENTRADA') {
      newQty += qty;
      const batchCost = unitCost !== undefined ? Number(unitCost) : null;
      if (batchCost !== null && batchCost >= 0) {
        // Custo Médio Ponderado (CMP)
        // CMP = ((estoque_anterior * custo_anterior) + (qtd_entrada * custo_lote)) / novo_estoque_total
        const currentTotal = item.quantity > 0 ? (item.quantity * item.costPrice) : 0;
        const incomingTotal = qty * batchCost;
        if (newQty > 0) {
          newCostPrice = Math.round(((currentTotal + incomingTotal) / newQty) * 100) / 100;
        }
      }
    } else if (type === 'SAIDA' || type === 'PERDA') {
      newQty = Math.max(0, newQty - qty);
    } else {
      newQty = qty; // AJUSTE
      if (unitCost !== undefined && Number(unitCost) >= 0) {
        newCostPrice = Number(unitCost);
      }
    }

    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          itemId,
          type,
          quantity: qty,
          unitCost: unitCost !== undefined ? Number(unitCost) : item.costPrice,
          reason: reason?.trim() || '',
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: newQty,
          costPrice: newCostPrice,
        },
      }),
    ]);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    return { ...updated, lowStock: (updated?.quantity ?? 0) <= (updated?.minQuantity ?? 5) };
  });

  // ── DELETE /api/inventory/:id — Desativar item ────────────────────────
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const itemId = parseSafeInt((request.params as any)?.id);
    if (!itemId) {
      return reply.status(400).send({ error: 'ID de item inválido' });
    }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, adminId: user.id },
    });
    if (!item) return reply.status(404).send({ error: 'Item não encontrado.' });

    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { active: false },
    });

    return reply.status(204).send();
  });

  // ── GET /api/inventory/alerts — Itens com estoque baixo ───────────────
  app.get('/alerts', async (request: FastifyRequest) => {
    const user = request.user as { id: number };

    const items = await prisma.inventoryItem.findMany({
      where: { adminId: user.id, active: true },
    });

    return items.filter(item => item.quantity <= item.minQuantity);
  });
}
