import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { createAuditLog } from '../utils/auditLogger';
import { parseSafeInt, updateOrderStatusSchema, updateOrderPaymentSchema } from '../utils/validators';

export default async function orderRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // GET /api/orders — List orders for admin (with optional status and date filters)
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    const { status, startDate, endDate } = request.query as {
      status?: string;
      startDate?: string;
      endDate?: string;
    };

    const whereClause: any = { adminId: user.id };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.deliveryDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: {
              include: {
                photos: { take: 1, orderBy: { position: 'asc' } },
              },
            },
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ deliveryDate: 'asc' }, { createdAt: 'desc' }],
    });

    return orders;
  });

  // GET /api/orders/stats — Overview metrics for dashboard
  app.get('/stats', async (request) => {
    const user = request.user as { id: number };

    const [allOrders, topItems] = await Promise.all([
      prisma.order.findMany({
        where: { adminId: user.id },
        select: {
          id: true,
          status: true,
          total: true,
          depositAmount: true,
          depositPaid: true,
          deliveryDate: true,
          createdAt: true,
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        where: {
          order: { adminId: user.id },
        },
        _sum: {
          quantity: true,
          subtotal: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    const totalOrders = allOrders.length;
    const activeOrders = allOrders.filter(
      (o) => o.status !== 'ENTREGUE' && o.status !== 'CANCELADO'
    ).length;
    const completedOrders = allOrders.filter((o) => o.status === 'ENTREGUE').length;
    const canceledOrders = allOrders.filter((o) => o.status === 'CANCELADO').length;

    const totalRevenue = allOrders
      .filter((o) => o.status !== 'CANCELADO')
      .reduce((sum, o) => sum + o.total, 0);

    const receivedRevenue = allOrders
      .filter((o) => o.status !== 'CANCELADO')
      .reduce((sum, o) => sum + (o.depositPaid ? o.depositAmount : 0), 0);

    // Contadores por status para o Kanban
    const statusCounts = {
      NOVO: allOrders.filter((o) => o.status === 'NOVO').length,
      CONFIRMADO: allOrders.filter((o) => o.status === 'CONFIRMADO').length,
      EM_PRODUCAO: allOrders.filter((o) => o.status === 'EM_PRODUCAO').length,
      PRONTO: allOrders.filter((o) => o.status === 'PRONTO').length,
      ENTREGUE: allOrders.filter((o) => o.status === 'ENTREGUE').length,
      CANCELADO: canceledOrders,
    };

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      canceledOrders,
      totalRevenue,
      receivedRevenue,
      pendingBalance: Math.max(0, totalRevenue - receivedRevenue),
      statusCounts,
      topProducts: topItems.map((item) => ({
        name: item.productName || 'Produto',
        quantity: item._sum.quantity || 0,
        total: item._sum.subtotal || 0,
      })),
    };
  });

  // GET /api/orders/:id — Single order details
  app.get('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const orderId = parseSafeInt((request.params as any)?.id);
    if (!orderId) {
      return reply.status(400).send({ error: 'ID de pedido inválido' });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, adminId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                photos: { orderBy: { position: 'asc' } },
              },
            },
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return reply.status(404).send({ error: 'Pedido não encontrado' });
    }

    return order;
  });

  // PATCH /api/orders/:id/status — Update order status (Kanban drag & drop)
  app.patch('/:id/status', async (request, reply) => {
    const user = request.user as { id: number };
    const orderId = parseSafeInt((request.params as any)?.id);
    if (!orderId) {
      return reply.status(400).send({ error: 'ID de pedido inválido' });
    }

    const validation = updateOrderStatusSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.errors[0]?.message || 'Dados de status inválidos' });
    }

    const { status, note } = validation.data;

    const order = await prisma.order.findFirst({
      where: { id: orderId, adminId: user.id },
    });

    if (!order) {
      return reply.status(404).send({ error: 'Pedido não encontrado' });
    }

    const oldStatus = order.status;

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await tx.orderStatusLog.create({
        data: {
          orderId: order.id,
          oldStatus,
          newStatus: status,
          note: note || `Status alterado para ${status}`,
        },
      });

      return o;
    });

    await createAuditLog(request, {
      action: 'UPDATE_ORDER_STATUS',
      entity: 'ORDER',
      entityId: order.id,
      details: `Alterou o status do pedido "${order.orderNumber}" de ${oldStatus} para ${status}`,
      adminId: user.id,
    });

    return updated;
  });

  // PATCH /api/orders/:id/payment — Mark deposit or full payment as paid
  app.patch('/:id/payment', async (request, reply) => {
    const user = request.user as { id: number };
    const orderId = parseSafeInt((request.params as any)?.id);
    if (!orderId) {
      return reply.status(400).send({ error: 'ID de pedido inválido' });
    }

    const validation = updateOrderPaymentSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({ error: 'Campo depositPaid inválido (deve ser boolean)' });
    }

    const { depositPaid } = validation.data;

    const order = await prisma.order.findFirst({
      where: { id: orderId, adminId: user.id },
    });

    if (!order) {
      return reply.status(404).send({ error: 'Pedido não encontrado' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { depositPaid },
    });

    return updated;
  });

  // DELETE /api/orders/:id — Delete order
  app.delete('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const orderId = parseSafeInt((request.params as any)?.id);
    if (!orderId) {
      return reply.status(400).send({ error: 'ID de pedido inválido' });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, adminId: user.id },
    });

    if (!order) {
      return reply.status(404).send({ error: 'Pedido não encontrado' });
    }

    await prisma.order.delete({ where: { id: orderId } });

    await createAuditLog(request, {
      action: 'DELETE_ORDER',
      entity: 'ORDER',
      entityId: orderId,
      details: `Excluiu o pedido "${order.orderNumber}" de ${order.clientName}`,
      adminId: user.id,
    });

    return reply.status(204).send();
  });
}
