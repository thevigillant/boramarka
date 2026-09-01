import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function inventoryRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ── GET /api/inventory — Listar itens do estoque ──────────────────────
  app.get('/', async (request: FastifyRequest) => {
    const user = request.user as { id: number };

    const items = await prisma.inventoryItem.findMany({
      where: { adminId: user.id, active: true },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { name: 'asc' },
    });

    return items.map(item => ({
      ...item,
      lowStock: item.quantity <= item.minQuantity,
    }));
  });

  // ── POST /api/inventory — Criar item ──────────────────────────────────
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { name, description, category, unit, costPrice, salePrice, quantity, minQuantity, photoUrl } = request.body as any;

    if (!name?.trim()) return reply.status(400).send({ error: 'Nome é obrigatório.' });

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
    const { id } = request.params as { id: string };
    const itemId = parseInt(id);
    const body = request.body as any;

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, adminId: user.id },
    });
    if (!item) return reply.status(404).send({ error: 'Item não encontrado.' });

    const updated = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        name: body.name?.trim() || item.name,
        description: body.description !== undefined ? body.description.trim() : item.description,
        category: body.category || item.category,
        unit: body.unit || item.unit,
        costPrice: body.costPrice !== undefined ? Number(body.costPrice) : item.costPrice,
        salePrice: body.salePrice !== undefined ? Number(body.salePrice) : item.salePrice,
        minQuantity: body.minQuantity !== undefined ? Number(body.minQuantity) : item.minQuantity,
        photoUrl: body.photoUrl !== undefined ? body.photoUrl : item.photoUrl,
      },
    });

    return updated;
  });

  // ── POST /api/inventory/:id/movement — Registrar movimentação ─────────
  app.post('/:id/movement', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const itemId = parseInt(id);
    const { type, quantity, reason } = request.body as any;

    const validTypes = ['ENTRADA', 'SAIDA', 'AJUSTE'];
    if (!validTypes.includes(type)) return reply.status(400).send({ error: 'Tipo inválido. Use ENTRADA, SAIDA ou AJUSTE.' });
    if (!quantity || Number(quantity) <= 0) return reply.status(400).send({ error: 'Quantidade deve ser maior que zero.' });

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, adminId: user.id },
    });
    if (!item) return reply.status(404).send({ error: 'Item não encontrado.' });

    const qty = Number(quantity);
    let newQty = item.quantity;
    if (type === 'ENTRADA') newQty += qty;
    else if (type === 'SAIDA') newQty = Math.max(0, newQty - qty);
    else newQty = qty; // AJUSTE: seta diretamente

    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          itemId,
          type,
          quantity: qty,
          reason: reason?.trim() || '',
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQty },
      }),
    ]);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    return { ...updated, lowStock: (updated?.quantity ?? 0) <= (updated?.minQuantity ?? 5) };
  });

  // ── DELETE /api/inventory/:id — Desativar item ────────────────────────
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const itemId = parseInt(id);

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
