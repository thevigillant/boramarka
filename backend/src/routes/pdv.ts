import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { parseSafeInt, createPdvSaleSchema } from '../utils/validators';

export default async function pdvRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ── GET /api/pdv/sales — Histórico de vendas ─────────────────────────
  app.get('/sales', async (request: FastifyRequest) => {
    const user = request.user as { id: number };
    const query = request.query as any;
    const pageNum = parseSafeInt(query?.page) || 1;
    const limitNum = Math.min(parseSafeInt(query?.limit) || 20, 100);
    const { from, to } = query || {};

    const where: any = { adminId: user.id };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [sales, total] = await Promise.all([
      prisma.saleTransaction.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.saleTransaction.count({ where }),
    ]);

    return { sales, total, page: pageNum, limit: limitNum };
  });

  // ── GET /api/pdv/stats — Estatísticas do PDV ─────────────────────────
  app.get('/stats', async (request: FastifyRequest) => {
    const user = request.user as { id: number };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySales, monthSales, allSales] = await Promise.all([
      prisma.saleTransaction.aggregate({
        where: { adminId: user.id, status: 'PAID', createdAt: { gte: today, lt: tomorrow } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.saleTransaction.aggregate({
        where: { adminId: user.id, status: 'PAID', createdAt: { gte: firstOfMonth } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.saleTransaction.aggregate({
        where: { adminId: user.id, status: 'PAID' },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    return {
      today: { total: todaySales._sum.total || 0, count: todaySales._count },
      month: { total: monthSales._sum.total || 0, count: monthSales._count },
      all: { total: allSales._sum.total || 0, count: allSales._count },
    };
  });

  // ── POST /api/pdv/sales — Criar venda ─────────────────────────────────
  app.post('/sales', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const validation = createPdvSaleSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.issues[0]?.message || 'Dados da venda inválidos' });
    }

    const { bookingId, employeeId, paymentMethod, discount, notes, items } = validation.data;

    // Calcula total
    const subtotal = items.reduce((acc: number, i) => acc + (Number(i.unitPrice) * Number(i.quantity)), 0);
    const discountAmt = Number(discount) || 0;
    const total = Math.max(0, subtotal - discountAmt);

    const sale = await prisma.$transaction(async (tx) => {
      // Cria a venda
      const newSale = await tx.saleTransaction.create({
        data: {
          adminId: user.id,
          bookingId: bookingId || null,
          employeeId: employeeId || null,
          paymentMethod: paymentMethod || 'PIX',
          discount: discountAmt,
          total,
          notes: notes?.trim() || '',
          status: 'PAID',
          items: {
            create: items.map((item) => ({
              name: item.name,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              subtotal: Number(item.unitPrice) * (Number(item.quantity) || 1),
              itemType: item.itemType || 'SERVICE',
              inventoryItemId: item.inventoryItemId || null,
            })),
          },
        },
        include: { items: true },
      });

      // Baixa automática do estoque para itens com inventoryItemId
      for (const item of items) {
        if (item.inventoryItemId && item.quantity > 0) {
          const invItem = await tx.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
          if (invItem) {
            await tx.inventoryItem.update({
              where: { id: item.inventoryItemId },
              data: { quantity: Math.max(0, invItem.quantity - Number(item.quantity)) },
            });
            await tx.stockMovement.create({
              data: {
                itemId: item.inventoryItemId,
                type: 'SAIDA',
                quantity: Number(item.quantity),
                reason: `Venda PDV #${newSale.id}`,
              },
            });
          }
        }
      }

      // Lança receita no módulo Financeiro
      await tx.transaction.create({
        data: {
          adminId: user.id,
          type: 'receivable',
          description: `Venda PDV${bookingId ? ` — Agendamento #${bookingId}` : ''}`,
          amount: total,
          dueDate: new Date().toISOString().slice(0, 10),
          paid: true,
          paidAt: new Date().toISOString().slice(0, 10),
          category: 'PDV',
          notes: notes?.trim() || '',
        },
      });

      return newSale;
    });

    return reply.status(201).send(sale);
  });

  // ── PATCH /api/pdv/sales/:id/cancel — Cancelar venda ─────────────────
  app.patch('/sales/:id/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const saleId = parseSafeInt((request.params as any)?.id);
    if (!saleId) {
      return reply.status(400).send({ error: 'ID de venda inválido' });
    }

    const sale = await prisma.saleTransaction.findFirst({
      where: { id: saleId, adminId: user.id },
    });
    if (!sale) return reply.status(404).send({ error: 'Venda não encontrada.' });
    if (sale.status === 'CANCELLED') return reply.status(400).send({ error: 'Venda já cancelada.' });

    await prisma.saleTransaction.update({
      where: { id: saleId },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Venda cancelada com sucesso.' };
  });
}
