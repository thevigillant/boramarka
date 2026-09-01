import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate, requirePermission } from '../plugins/auth';

export default async function queueRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ── GET /api/queue — Lista fila ativa do dia ──────────────────────────
  app.get('/', async (request: FastifyRequest) => {
    const user = request.user as { id: number };

    const queue = await prisma.walkInQueue.findMany({
      where: {
        adminId: user.id,
        status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return queue;
  });

  // ── GET /api/queue/history — Histórico do dia ─────────────────────────
  app.get('/history', async (request: FastifyRequest) => {
    const user = request.user as { id: number };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const history = await prisma.walkInQueue.findMany({
      where: {
        adminId: user.id,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return history;
  });

  // ── POST /api/queue — Adicionar cliente à fila ────────────────────────
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { clientName, clientPhone, serviceName, employeeId, notes } = request.body as any;

    if (!clientName?.trim()) {
      return reply.status(400).send({ error: 'Nome do cliente é obrigatório.' });
    }

    // Calcula posição (último + 1)
    const lastInQueue = await prisma.walkInQueue.findFirst({
      where: { adminId: user.id, status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] } },
      orderBy: { position: 'desc' },
    });
    const position = (lastInQueue?.position ?? 0) + 1;

    // Estima tempo de espera (15 min por pessoa na frente)
    const waitingCount = await prisma.walkInQueue.count({
      where: { adminId: user.id, status: 'WAITING' },
    });
    const estimatedWait = waitingCount * 15;

    const entry = await prisma.walkInQueue.create({
      data: {
        adminId: user.id,
        clientName: clientName.trim(),
        clientPhone: (clientPhone || '').trim(),
        serviceName: (serviceName || '').trim(),
        employeeId: employeeId || null,
        notes: (notes || '').trim(),
        position,
        estimatedWait,
      },
    });

    return reply.status(201).send(entry);
  });

  // ── PATCH /api/queue/:id/call — Chamar próximo ────────────────────────
  app.patch('/:id/call', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const entryId = parseInt(id);

    const entry = await prisma.walkInQueue.findFirst({
      where: { id: entryId, adminId: user.id },
    });

    if (!entry) return reply.status(404).send({ error: 'Entrada não encontrada.' });

    const updated = await prisma.walkInQueue.update({
      where: { id: entryId },
      data: { status: 'CALLED', notified: true },
    });

    // Disparo de mensagem WhatsApp (sem auth — usa format de link)
    const adminInfo = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { businessName: true, phone: true },
    });
    const msg = `🔔 *${entry.clientName}*, é a sua vez! Por favor, dirija-se ao atendimento em *${adminInfo?.businessName || 'nossa loja'}*. Aguardamos você!`;
    const cleanPhone = (entry.clientPhone || '').replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const whatsappUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`;
      // URL retornada para o admin clicar e enviar
      return { ...updated, whatsappUrl };
    }

    return updated;
  });

  // ── PATCH /api/queue/:id/status — Atualizar status ───────────────────
  app.patch('/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const entryId = parseInt(id);

    const validStatuses = ['WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: 'Status inválido.' });
    }

    const entry = await prisma.walkInQueue.findFirst({
      where: { id: entryId, adminId: user.id },
    });
    if (!entry) return reply.status(404).send({ error: 'Entrada não encontrada.' });

    const updated = await prisma.walkInQueue.update({
      where: { id: entryId },
      data: { status },
    });

    return updated;
  });

  // ── DELETE /api/queue/:id — Remover da fila ───────────────────────────
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const entryId = parseInt(id);

    const entry = await prisma.walkInQueue.findFirst({
      where: { id: entryId, adminId: user.id },
    });
    if (!entry) return reply.status(404).send({ error: 'Entrada não encontrada.' });

    await prisma.walkInQueue.delete({ where: { id: entryId } });
    return reply.status(204).send();
  });
}
