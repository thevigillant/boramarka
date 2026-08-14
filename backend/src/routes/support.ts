import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { createSupportTicketSchema, sendSupportMessageSchema, supportSatisfactionSchema } from '../utils/validators';
import { generateHelpdeskAutoReply } from '../services/helpdeskBot';

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
    const parsed = createSupportTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { subject, category, message, attachmentUrl, attachmentName } = parsed.data;

    const cat = category?.trim() || 'DUVIDA';
    
    // SLA inteligente & Prioridade automática
    let priority = 'NORMAL';
    let slaHours = 48;

    if (cat === 'TECNICO' || cat === 'FINANCEIRO') {
      priority = 'HIGH';
      slaHours = 24;
    }

    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    const admin = await prisma.admin.findUnique({ where: { id: user.id } });
    const senderName = admin?.businessName || admin?.username || user.username || 'Cliente BoraMarka';

    const ticket = await prisma.supportTicket.create({
      data: {
        adminId: user.id,
        subject: subject.trim(),
        category: cat,
        status: 'IN_PROGRESS',
        priority,
        slaDeadline,
        messages: {
          create: {
            senderRole: 'USER',
            senderName,
            message: message.trim(),
            attachmentUrl: attachmentUrl || '',
            attachmentName: attachmentName || '',
          },
        },
        statusLogs: {
          create: {
            oldStatus: 'NONE',
            newStatus: 'OPEN',
            changedBy: senderName,
          },
        },
      },
      include: {
        messages: true,
        statusLogs: true,
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

    // 🤖 Resposta Automática Inteligente Imediata
    const botReply = generateHelpdeskAutoReply(message, subject, cat);
    if (botReply?.answer) {
      const autoMsg = await prisma.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderRole: 'SUPPORT',
          senderName: 'Assistente IA BoraMarka',
          message: botReply.answer,
        },
      });
      ticket.messages.push(autoMsg);
    }

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

    // Check & calculate SLA status
    const now = new Date();
    const result = tickets.map(t => {
      const isOverdue = t.slaDeadline && new Date(t.slaDeadline) < now && t.status !== 'RESOLVED';
      return {
        ...t,
        isOverdue: !!isOverdue,
      };
    });

    return result;
  });

  // 3. GET /api/support/tickets/:id — Detalhes do chamado
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
        statusLogs: {
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

    const now = new Date();
    const isOverdue = ticket.slaDeadline && new Date(ticket.slaDeadline) < now && ticket.status !== 'RESOLVED';

    return { ...ticket, isOverdue: !!isOverdue };
  });

  // 4. POST /api/support/tickets/:id/messages — Enviar mensagem no chamado
  app.post('/tickets/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number; username: string; role: string };
    const { id } = request.params as { id: string };
    const parsed = sendSupportMessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { message, attachmentUrl, attachmentName } = parsed.data;
    const ticketId = parseInt(id);

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

    const isSupportAgent = user.role === 'superadmin';
    const senderName = isSupportAgent ? 'Suporte BoraMarka' : (ticket.admin.businessName || ticket.admin.username || 'Cliente');

    const newMsg = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderRole: isSupportAgent ? 'SUPERADMIN' : 'USER',
        senderName,
        message: message.trim(),
        attachmentUrl: attachmentUrl || '',
        attachmentName: attachmentName || '',
      },
    });

    // Reabre o ticket se o usuário mandou mensagem em ticket resolvido
    if (!isSupportAgent && ticket.status === 'RESOLVED') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
      await prisma.supportStatusLog.create({
        data: {
          ticketId,
          oldStatus: ticket.status,
          newStatus: 'IN_PROGRESS',
          changedBy: senderName,
        },
      });
    }

    // 🤖 Resposta Automática Inteligente Imediata no Chat
    if (!isSupportAgent) {
      const botReply = generateHelpdeskAutoReply(message, ticket.subject, ticket.category);
      if (botReply?.answer) {
        await prisma.supportMessage.create({
          data: {
            ticketId,
            senderRole: 'SUPPORT',
            senderName: 'Assistente IA BoraMarka',
            message: botReply.answer,
          },
        });
      }
    }

    return reply.status(201).send(newMsg);
  });

  // 5. PATCH /api/support/tickets/:id/status — Alterar status do chamado
  app.patch('/tickets/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number; role: string; username: string };
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

    if (status !== ticket.status) {
      await prisma.supportStatusLog.create({
        data: {
          ticketId,
          oldStatus: ticket.status,
          newStatus: status,
          changedBy: user.username || 'Sistema',
        },
      });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() },
    });

    return updated;
  });

  // 6. POST /api/support/tickets/:id/satisfaction — Avaliação de satisfação pós-atendimento
  app.post('/tickets/:id/satisfaction', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const parsed = supportSatisfactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { rating, comment } = parsed.data;
    const ticketId = parseInt(id);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.adminId !== user.id) {
      return reply.status(403).send({ error: 'Acesso negado.' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        satisfactionRating: rating,
        satisfactionComment: comment?.trim() || '',
      },
    });

    return updated;
  });

  // 7. GET /api/support/templates — Respostas Rápidas / Templates (SuperAdmin & Staff)
  app.get('/templates', async () => {
    const templates = await prisma.supportReplyTemplate.findMany({
      orderBy: { title: 'asc' },
    });
    return templates;
  });

  // 8. POST /api/support/templates — Criar novo Template de Resposta Rápida (SuperAdmin)
  app.post('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string };
    if (user.role !== 'superadmin') {
      return reply.status(403).send({ error: 'Apenas SuperAdmin pode gerenciar templates.' });
    }

    const { title, category, content } = request.body as { title: string; category?: string; content: string };
    if (!title?.trim() || !content?.trim()) {
      return reply.status(400).send({ error: 'Título e conteúdo são obrigatórios.' });
    }

    const template = await prisma.supportReplyTemplate.create({
      data: {
        title: title.trim(),
        category: category?.trim() || 'GERAL',
        content: content.trim(),
      },
    });

    return reply.status(201).send(template);
  });
}
