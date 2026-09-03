import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate, requirePermission } from '../plugins/auth';

export default async function purchaseRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);
  app.addHook('preHandler', requirePermission('canFinanceiro'));

  // ── GET /api/v1/purchases — Listar pedidos de compras ────────────────
  app.get('/', async (request: FastifyRequest) => {
    const user = request.user as { id: number };
    const { status, supplierId, search, startDate, endDate } = request.query as {
      status?: string;
      supplierId?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    };

    const where: any = { adminId: user.id };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId);
    }

    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = startDate;
      if (endDate) where.purchaseDate.lte = endDate;
    }

    if (search?.trim()) {
      const clean = search.trim();
      where.OR = [
        { purchaseNumber: { contains: clean, mode: 'insensitive' } },
        { supplier: { corporateName: { contains: clean, mode: 'insensitive' } } },
        { supplier: { tradeName: { contains: clean, mode: 'insensitive' } } },
        { notes: { contains: clean, mode: 'insensitive' } },
      ];
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            corporateName: true,
            tradeName: true,
            cnpj: true,
            phone: true,
          },
        },
        items: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            paid: true,
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    const totalPurchased = purchases
      .filter(p => p.status !== 'CANCELLED')
      .reduce((acc, p) => acc + p.totalAmount, 0);

    const pendingDelivery = purchases
      .filter(p => p.status === 'PENDING' || p.status === 'APPROVED')
      .reduce((acc, p) => acc + p.totalAmount, 0);

    return {
      summary: {
        count: purchases.length,
        totalPurchased,
        pendingDelivery,
      },
      purchases,
    };
  });

  // ── GET /api/v1/purchases/:id — Detalhes da compra ───────────────────
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const purchaseId = parseInt(id);

    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, adminId: user.id },
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
          },
        },
        invoice: true,
      },
    });

    if (!purchase) {
      return reply.status(404).send({ error: 'Compra não encontrada.' });
    }

    return purchase;
  });

  // ── POST /api/v1/purchases — Criar pedido de compra ──────────────────
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const {
      supplierId,
      purchaseDate,
      expectedDeliveryDate,
      paymentMethod,
      dueDate,
      notes,
      items,
    } = request.body as any;

    if (!supplierId) {
      return reply.status(400).send({ error: 'Fornecedor é obrigatório.' });
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: Number(supplierId), adminId: user.id },
    });
    if (!supplier) {
      return reply.status(404).send({ error: 'Fornecedor não encontrado.' });
    }

    const rawItems: any[] = Array.isArray(items) ? items : [];
    if (rawItems.length === 0) {
      return reply.status(400).send({ error: 'Adicione pelo menos um item à compra.' });
    }

    // Calcula total dos itens
    let totalAmount = 0;
    const formattedItems = rawItems.map(it => {
      const qty = Number(it.quantity) || 1;
      const uPrice = Number(it.unitPrice) || 0;
      const sub = Number(it.subtotal) || qty * uPrice;
      totalAmount += sub;
      return {
        name: it.name?.trim() || 'Insumo / Material',
        category: it.category || 'INSUMO',
        quantity: qty,
        unit: it.unit?.trim() || 'un',
        unitPrice: uPrice,
        subtotal: sub,
        notes: it.notes?.trim() || '',
        inventoryItemId: it.inventoryItemId ? Number(it.inventoryItemId) : null,
      };
    });

    // Gera número sequencial de compra para o admin
    const count = await prisma.purchase.count({ where: { adminId: user.id } });
    const purchaseNumber = `#CMP-${(count + 1001).toString()}`;

    const purchase = await prisma.purchase.create({
      data: {
        adminId: user.id,
        purchaseNumber,
        supplierId: supplier.id,
        purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        expectedDeliveryDate: expectedDeliveryDate || null,
        status: 'PENDING',
        paymentMethod: paymentMethod || 'BOLETO',
        paymentStatus: 'PENDING',
        dueDate: dueDate || null,
        totalAmount,
        notes: notes?.trim() || '',
        items: {
          create: formattedItems,
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    return reply.status(201).send(purchase);
  });

  // ── PATCH /api/v1/purchases/:id/status — Alterar status da compra ─────
  app.patch('/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const purchaseId = parseInt(id);
    const { status, updateStock } = request.body as { status: string; updateStock?: boolean };

    const validStatuses = ['PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: 'Status inválido.' });
    }

    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, adminId: user.id },
      include: { items: true },
    });

    if (!purchase) {
      return reply.status(404).send({ error: 'Compra não encontrada.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          status,
          ...(status === 'RECEIVED' ? { receivedDate: new Date().toISOString().split('T')[0] } : {}),
        },
      });

      // Se passou para RECEBIDA e o usuário quer dar entrada no estoque
      if (status === 'RECEIVED' && updateStock) {
        for (const it of purchase.items) {
          let stockItemId = it.inventoryItemId;

          // Se não tiver ID de estoque vinculado, busca por nome existente ou cria novo
          if (!stockItemId && it.name?.trim()) {
            const existing = await tx.inventoryItem.findFirst({
              where: {
                adminId: user.id,
                name: { equals: it.name.trim(), mode: 'insensitive' },
                active: true,
              },
            });

            if (existing) {
              stockItemId = existing.id;
            } else {
              const created = await tx.inventoryItem.create({
                data: {
                  adminId: user.id,
                  name: it.name.trim(),
                  category: it.category === 'INSUMOS' || it.category === 'INSUMO' ? 'INSUMO' : 'PRODUTO',
                  unit: it.unit?.trim() || 'un',
                  costPrice: it.unitPrice || 0,
                  salePrice: it.unitPrice > 0 ? Number((it.unitPrice * 1.5).toFixed(2)) : 0,
                  quantity: 0,
                  minQuantity: 5,
                  active: true,
                },
              });
              stockItemId = created.id;
            }

            // Salva vínculo no PurchaseItem
            await tx.purchaseItem.update({
              where: { id: it.id },
              data: { inventoryItemId: stockItemId },
            });
          }

          if (stockItemId) {
            const stockItem = await tx.inventoryItem.findFirst({
              where: { id: stockItemId, adminId: user.id },
            });
            if (stockItem) {
              const addQty = Math.max(1, Math.round(it.quantity));
              await tx.inventoryItem.update({
                where: { id: stockItem.id },
                data: {
                  quantity: stockItem.quantity + addQty,
                  ...(it.unitPrice > 0 ? { costPrice: it.unitPrice } : {}),
                },
              });

              await tx.stockMovement.create({
                data: {
                  itemId: stockItem.id,
                  type: 'ENTRADA',
                  quantity: addQty,
                  reason: `Recebimento de compra ${purchase.purchaseNumber}`,
                },
              });
            }
          }
        }
      }
    });

    const updated = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { supplier: true, items: true },
    });

    return updated;
  });

  // ── DELETE /api/v1/purchases/:id — Cancelar/Excluir compra ────────────
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const purchaseId = parseInt(id);

    const purchase = await prisma.purchase.findFirst({
      where: { id: purchaseId, adminId: user.id },
    });

    if (!purchase) {
      return reply.status(404).send({ error: 'Compra não encontrada.' });
    }

    await prisma.purchase.delete({
      where: { id: purchaseId },
    });

    return reply.status(204).send();
  });
}
