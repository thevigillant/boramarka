import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function socialRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', authenticate);

  // GET /api/admin/social/explore — Get all other professionals on the platform
  app.get('/explore', async (request) => {
    const user = request.user as { id: number };
    const { q } = request.query as { q?: string };

    const searchFilter = q?.trim() ? {
      OR: [
        { username: { contains: q } },
        { businessName: { contains: q } },
        { description: { contains: q } },
        { address: { contains: q } }
      ]
    } : {};

    return prisma.admin.findMany({
      where: {
        id: { not: user.id },
        ...searchFilter
      },
      select: {
        id: true,
        username: true,
        businessName: true,
        description: true,
        photoUrl: true,
        address: true,
        phone: true,
        accentColor: true,
        secondaryColor: true
      },
      orderBy: {
        username: 'asc'
      }
    });
  });

  // GET /api/admin/social/chats — List all conversation partners (Inbox)
  app.get('/chats', async (request) => {
    const user = request.user as { id: number };

    // Get all messages sent or received by this user
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: { id: true, username: true, businessName: true, photoUrl: true }
        },
        receiver: {
          select: { id: true, username: true, businessName: true, photoUrl: true }
        }
      }
    });

    // Group messages by partner id
    const conversationsMap = new Map<number, {
      partner: { id: number; username: string; businessName: string; photoUrl: string };
      lastMessage: string;
      timestamp: Date;
    }>();

    for (const msg of messages) {
      const partner = msg.senderId === user.id ? msg.receiver : msg.sender;
      if (!conversationsMap.has(partner.id)) {
        conversationsMap.set(partner.id, {
          partner: {
            id: partner.id,
            username: partner.username,
            businessName: partner.businessName || partner.username,
            photoUrl: partner.photoUrl
          },
          lastMessage: msg.content,
          timestamp: msg.createdAt
        });
      }
    }

    return Array.from(conversationsMap.values());
  });

  // GET /social/chats/:partnerId — Get message history with a partner
  app.get('/chats/:partnerId', async (request, reply) => {
    const user = request.user as { id: number };
    const { partnerId } = request.params as { partnerId: string };

    const parsedPartnerId = parseInt(partnerId);
    if (isNaN(parsedPartnerId)) {
      return reply.status(400).send({ error: 'ID do parceiro inválido' });
    }

    return prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: parsedPartnerId },
          { senderId: parsedPartnerId, receiverId: user.id }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  });

  // POST /social/chats/:receiverId — Send message to a partner
  app.post('/chats/:receiverId', async (request, reply) => {
    const user = request.user as { id: number };
    const { receiverId } = request.params as { receiverId: string };
    const { content } = request.body as { content: string };

    const parsedReceiverId = parseInt(receiverId);
    if (isNaN(parsedReceiverId)) {
      return reply.status(400).send({ error: 'ID do destinatário inválido' });
    }

    if (!content?.trim()) {
      return reply.status(400).send({ error: 'A mensagem não pode ser vazia' });
    }

    // Verify receiver exists
    const receiver = await prisma.admin.findUnique({
      where: { id: parsedReceiverId }
    });

    if (!receiver) {
      return reply.status(404).send({ error: 'Destinatário não encontrado' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        senderId: user.id,
        receiverId: parsedReceiverId
      }
    });

    return reply.status(201).send(message);
  });
}
