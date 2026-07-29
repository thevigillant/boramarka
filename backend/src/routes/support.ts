import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';

export async function authenticateToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

export default async function supportRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticateToken);

  // 1. POST /api/support/tickets — Criar novo chamado de ajuda
  app.post('/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number; username: string; role: string };
    const { subject, category, message } = request.body as {
      subject: string;
      category?: string;
      message: string;
    };

    if (!subject?.trim() || !message?.trim()) {
      return reply.status(400).send({ error: 'Assunto e mensagem são obrigatórios.' });
    }

    // Busca dados do usuário para colocar no senderName
    const admin = await prisma.admin.findUnique({ where: { id: user.id } });
    const senderName = admin?.businessName || admin?.username || user.username || 'Cliente BoraMarka';

    const ticket = await prisma.supportTicket.create({
      data: {
        adminId: user.id,
        subject: subject.trim(),
        category: category?.trim() || 'DUVIDA',
        status: 'OPEN',
        priority: 'NORMAL',
        messages: {
          create: {
            senderRole: 'USER',
            senderName,
            message: message.trim(),
          },
        },
      },
      include: {
        messages: true,
        admin: {
          select: {
            id: true,
            username: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return reply.status(201).send(ticket);
  });

  // 2. GET /api/support/tickets — Listar todos os chamados
  app.get('/tickets', async (request: FastifyRequest) => {
    const user = request.user as { id: number; role: string };

    const where = user.role === 'superadmin' ? {} : { adminId: user.id };

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return tickets;
  });

  // 3. GET /api/support/tickets/:id — Detalhes do chamado e histórico de mensagens
  app.get('/tickets/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number; role: string };
    const { id } = request.params as { id: string };
    const ticketId = parseInt(id);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        admin: {
          select: {
            id: true,
            username: true,
            businessName: true,
            phone: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return reply.status(404).send({ error: 'Chamado não encontrado.' });
    }

    if (user.role !== 'superadmin' && ticket.adminId !== user.id) {
      return reply.status(403).send({ error: 'Acesso não autorizado a este chamado.' });
    }

    return ticket;
  });

  // 4. POST /api/support/tickets/:id/messages — Responder no chamado
  app.post('/tickets/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number; username: string; role: string };
    const { id } = request.params as { id: string };
    const { message } = request.body as { message: string };
    const ticketId = parseInt(id);

    if (!message?.trim()) {
      return reply.status(400).send({ error: 'A mensagem não pode estar vazia.' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { admin: true },
    });

    if (!ticket) {
      return reply.status(404).send({ error: 'Chamado não encontrado.' });
    }

    if (user.role !== 'superadmin' && ticket.adminId !== user.id) {
      return reply.status(403).send({ error: 'Acesso não autorizado a este chamado.' });
    }

    const isSuperAdmin = user.role === 'superadmin';
    const senderRole = isSuperAdmin ? 'SUPERADMIN' : 'USER';
    const senderName = isSuperAdmin ? 'Suporte BoraMarka (Gestor)' : (ticket.admin.businessName || ticket.admin.username || user.username);

    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderRole,
        senderName,
        message: message.trim(),
      },
    });

    // Atualiza status e data de modificação do chamado
    const newStatus = isSuperAdmin ? (ticket.status === 'RESOLVED' ? 'IN_PROGRESS' : ticket.status) : 'OPEN';
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        status: newStatus,
      },
    });

    return reply.status(201).send(newMessage);
  });

  // 5. PATCH /api/support/tickets/:id/status — Alterar status do chamado (ex: Concluir)
  app.patch('/tickets/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number; role: string };
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' };
    const ticketId = parseInt(id);

    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return reply.status(400).send({ error: 'Status inválido.' });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return reply.status(404).send({ error: 'Chamado não encontrado.' });
    }

    if (user.role !== 'superadmin' && ticket.adminId !== user.id) {
      return reply.status(403).send({ error: 'Acesso não autorizado.' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() },
    });

    return updated;
  });
}
