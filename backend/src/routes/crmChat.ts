import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate, requirePermission } from '../plugins/auth';
import { sendWhatsAppMessage } from '../services/whatsapp';
import { checkQuota } from '../services/subscription';
import { createCustomerContactSchema, updateCustomerContactSchema, sendCrmMessageSchema } from '../utils/validators';

export default async function crmChatRoutes(app: FastifyInstance) {
  // All routes require authentication and canClientes permission
  app.addHook('onRequest', authenticate);
  app.addHook('preHandler', requirePermission('canClientes'));

  // ═══════════════════════════════════════════════════════════
  // 1. CONTACTS MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  // GET /api/admin/crm-chat/contacts — List contacts with search/filter
  app.get('/contacts', async (request) => {
    const user = request.user as { id: number };
    const { q, status } = request.query as { q?: string; status?: string };

    const searchFilter: any = {};
    if (q?.trim()) {
      searchFilter.OR = [
        { name: { contains: q.trim() } },
        { phone: { contains: q.trim() } },
        { notes: { contains: q.trim() } },
      ];
    }
    if (status && status !== 'TODOS') {
      searchFilter.status = status;
    }

    let contacts = await prisma.customerContact.findMany({
      where: {
        adminId: user.id,
        ...searchFilter,
      },
      orderBy: {
        lastInteraction: 'desc',
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Auto-seed initial demonstration contacts if the user has no contacts yet
    if (contacts.length === 0 && !q && (!status || status === 'TODOS')) {
      const seedContactsData = [
        {
          name: 'Mariana Silva',
          phone: '(11) 98765-4321',
          email: 'mariana.silva@email.com',
          status: 'EM_ATENDIMENTO',
          notes: 'Cliente preferencial. Costuma agendar aos sábados pela manhã.',
          tags: JSON.stringify(['VIP', 'Corte & Cor', 'Sábado']),
          unreadCount: 1,
          messages: {
            create: [
              {
                senderType: 'CLIENT',
                senderName: 'Mariana Silva',
                messageType: 'TEXT',
                content: 'Olá! Gostaria de saber se vocês têm horário disponível para este sábado às 10h?',
                status: 'SENT',
                adminId: user.id,
                createdAt: new Date(Date.now() - 3600000 * 2),
              },
              {
                senderType: 'STAFF',
                senderName: 'Atendimento',
                messageType: 'TEXT',
                content: 'Olá Mariana! Deixa eu verificar aqui na agenda para você só um instante. 😊',
                status: 'READ',
                adminId: user.id,
                createdAt: new Date(Date.now() - 3600000 * 1.8),
              },
              {
                senderType: 'CLIENT',
                senderName: 'Mariana Silva',
                messageType: 'AUDIO',
                content: 'Áudio gravado',
                mediaUrl: 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//5AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                mediaDuration: 12,
                status: 'SENT',
                adminId: user.id,
                createdAt: new Date(Date.now() - 3600000 * 1),
              },
            ],
          },
        },
        {
          name: 'Carlos Eduardo',
          phone: '(11) 99876-1234',
          email: 'carlos.eduardo@email.com',
          status: 'NOVO',
          notes: 'Primeiro contato via WhatsApp. Interessado em plano mensal.',
          tags: JSON.stringify(['Novo Cliente', 'Plano Mensal']),
          unreadCount: 0,
          messages: {
            create: [
              {
                senderType: 'CLIENT',
                senderName: 'Carlos Eduardo',
                messageType: 'TEXT',
                content: 'Boa tarde! Qual o valor do corte masculino e barba?',
                status: 'READ',
                adminId: user.id,
                createdAt: new Date(Date.now() - 3600000 * 24),
              },
              {
                senderType: 'STAFF',
                senderName: 'Atendimento',
                messageType: 'TEXT',
                content: 'Boa tarde Carlos! O combo Corte + Barba fica R$ 60,00. Você também pode assinar nosso plano ilimitado mensal por R$ 99,90!',
                status: 'READ',
                adminId: user.id,
                createdAt: new Date(Date.now() - 3600000 * 23.5),
              },
            ],
          },
        },
        {
          name: 'Ana Beatriz Souza',
          phone: '(11) 97123-5566',
          email: 'ana.souza@email.com',
          status: 'CONCLUIDO',
          notes: 'Confirmou pagamento via PIX.',
          tags: JSON.stringify(['Confirmado', 'PIX']),
          unreadCount: 0,
          messages: {
            create: [
              {
                senderType: 'STAFF',
                senderName: 'Atendimento',
                messageType: 'TEXT',
                content: 'Olá Ana! Seu agendamento para amanhã às 14:00 foi confirmado com sucesso. Te esperamos!',
                status: 'READ',
                adminId: user.id,
                createdAt: new Date(Date.now() - 3600000 * 48),
              },
              {
                senderType: 'CLIENT',
                senderName: 'Ana Beatriz Souza',
                messageType: 'TEXT',
                content: 'Perfeito! Muito obrigada pelo excelente atendimento! ❤️',
                status: 'READ',
                adminId: user.id,
                createdAt: new Date(Date.now() - 3600000 * 47),
              },
            ],
          },
        },
      ];

      for (const item of seedContactsData) {
        await prisma.customerContact.create({
          data: {
            name: item.name,
            phone: item.phone,
            email: item.email,
            status: item.status,
            notes: item.notes,
            tags: item.tags,
            unreadCount: item.unreadCount,
            adminId: user.id,
            messages: item.messages,
          },
        });
      }

      contacts = await prisma.customerContact.findMany({
        where: { adminId: user.id },
        orderBy: { lastInteraction: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    }

    return contacts;
  });

  // POST /api/admin/crm-chat/contacts — Create new contact
  app.post('/contacts', async (request, reply) => {
    const user = request.user as { id: number };
    const parsed = createCustomerContactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { name, phone, email, status, notes, tags, avatarUrl } = parsed.data;

    const quota = await checkQuota(user.id, 'customers');
    if (!quota.allowed) {
      return reply.status(403).send({ error: quota.message });
    }

    // Check if phone already exists for this admin
    const existing = await prisma.customerContact.findFirst({
      where: { adminId: user.id, phone: phone.trim() },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Já existe um contato cadastrado com este telefone.' });
    }

    const contact = await prisma.customerContact.create({
      data: {
        adminId: user.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || '',
        status: status || 'NOVO',
        notes: notes?.trim() || '',
        tags: JSON.stringify(tags || []),
        avatarUrl: avatarUrl || '',
      },
    });

    return reply.status(201).send(contact);
  });

  // PUT /api/admin/crm-chat/contacts/:id — Edit contact profile
  app.put('/contacts/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    
    const parsed = updateCustomerContactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { name, phone, email, status, notes, tags, avatarUrl } = parsed.data;

    const contactId = parseInt(id);
    if (isNaN(contactId)) {
      return reply.status(400).send({ error: 'ID do contato inválido' });
    }

    const contact = await prisma.customerContact.findFirst({
      where: { id: contactId, adminId: user.id },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    const updated = await prisma.customerContact.update({
      where: { id: contactId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes.trim() }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    return updated;
  });

  // DELETE /api/admin/crm-chat/contacts/:id — Delete contact
  app.delete('/contacts/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const contactId = parseInt(id);
    if (isNaN(contactId)) {
      return reply.status(400).send({ error: 'ID do contato inválido' });
    }

    const contact = await prisma.customerContact.findFirst({
      where: { id: contactId, adminId: user.id },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    await prisma.customerContact.delete({
      where: { id: contactId },
    });

    return { success: true, message: 'Contato excluído com sucesso' };
  });

  // ═══════════════════════════════════════════════════════════
  // 2. MESSAGES MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  // GET /api/admin/crm-chat/contacts/:contactId/messages — Get message history
  app.get('/contacts/:contactId/messages', async (request, reply) => {
    const user = request.user as { id: number };
    const { contactId } = request.params as { contactId: string };

    const parsedContactId = parseInt(contactId);
    if (isNaN(parsedContactId)) {
      return reply.status(400).send({ error: 'ID de contato inválido' });
    }

    const contact = await prisma.customerContact.findFirst({
      where: { id: parsedContactId, adminId: user.id },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    // Reset unread count to 0 and mark messages as READ when viewed
    if (contact.unreadCount > 0) {
      await prisma.customerContact.update({
        where: { id: parsedContactId },
        data: { unreadCount: 0 },
      });

      await prisma.clientChatMessage.updateMany({
        where: { contactId: parsedContactId, adminId: user.id, senderType: 'CLIENT' },
        data: { status: 'READ' },
      });
    }

    const messages = await prisma.clientChatMessage.findMany({
      where: { contactId: parsedContactId, adminId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  });

  // POST /api/admin/crm-chat/contacts/:contactId/messages — Send message
  app.post('/contacts/:contactId/messages', async (request, reply) => {
    const user = request.user as { id: number };
    const { contactId } = request.params as { contactId: string };
    const parsed = sendCrmMessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { content, messageType, mediaUrl, mediaName, mediaDuration } = parsed.data;

    const parsedContactId = parseInt(contactId);
    if (isNaN(parsedContactId)) {
      return reply.status(400).send({ error: 'ID de contato inválido' });
    }

    const contact = await prisma.customerContact.findFirst({
      where: { id: parsedContactId, adminId: user.id },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    const type = messageType || 'TEXT';

    if (type === 'TEXT' && !content?.trim()) {
      return reply.status(400).send({ error: 'A mensagem de texto não pode ser vazia' });
    }

    // Dispatch message via WhatsApp (Meta API or generate wa.me link fallback)
    const textToSend = content?.trim() || (type === 'AUDIO' ? '🎤 Áudio de voz enviado' : type === 'IMAGE' ? '📷 Foto enviada' : '📄 Documento anexo');
    const waResult = await sendWhatsAppMessage(contact.phone, textToSend);

    const message = await prisma.clientChatMessage.create({
      data: {
        adminId: user.id,
        contactId: parsedContactId,
        senderType: 'STAFF',
        senderName: 'Atendimento',
        messageType: type,
        content: content?.trim() || '',
        mediaUrl: mediaUrl || '',
        mediaName: mediaName || '',
        mediaDuration: mediaDuration || 0,
        status: 'READ',
      },
    });

    // Update last interaction
    await prisma.customerContact.update({
      where: { id: parsedContactId },
      data: { lastInteraction: new Date() },
    });

    return reply.status(201).send({
      ...message,
      whatsappLink: waResult.link,
      whatsappMethod: waResult.method,
    });
  });

  // POST /api/admin/crm-chat/contacts/:contactId/simulate-client-reply — Simulate incoming client message
  app.post('/contacts/:contactId/simulate-client-reply', async (request, reply) => {
    const user = request.user as { id: number };
    const { contactId } = request.params as { contactId: string };
    const { content, messageType, mediaUrl, mediaName, mediaDuration } = request.body as {
      content?: string;
      messageType?: string;
      mediaUrl?: string;
      mediaName?: string;
      mediaDuration?: number;
    };

    const parsedContactId = parseInt(contactId);
    if (isNaN(parsedContactId)) {
      return reply.status(400).send({ error: 'ID de contato inválido' });
    }

    const contact = await prisma.customerContact.findFirst({
      where: { id: parsedContactId, adminId: user.id },
    });

    if (!contact) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }

    const type = messageType || 'TEXT';

    const message = await prisma.clientChatMessage.create({
      data: {
        adminId: user.id,
        contactId: parsedContactId,
        senderType: 'CLIENT',
        senderName: contact.name,
        messageType: type,
        content: content?.trim() || 'Muito obrigado pelas informações!',
        mediaUrl: mediaUrl || '',
        mediaName: mediaName || '',
        mediaDuration: mediaDuration || 0,
        status: 'SENT',
      },
    });

    // Update contact's last interaction & increment unread count
    await prisma.customerContact.update({
      where: { id: parsedContactId },
      data: {
        lastInteraction: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    return reply.status(201).send(message);
  });

  // ═══════════════════════════════════════════════════════════
  // 3. QUICK REPLY TEMPLATES
  // ═══════════════════════════════════════════════════════════

  // GET /api/admin/crm-chat/templates — List quick reply templates
  app.get('/templates', async (request) => {
    const user = request.user as { id: number };

    let templates = await prisma.quickReplyTemplate.findMany({
      where: { adminId: user.id },
      orderBy: { shortcut: 'asc' },
    });

    // Auto-seed default templates if none exist
    if (templates.length === 0) {
      const defaultTemplates = [
        {
          shortcut: '/boas-vindas',
          title: 'Boas-vindas ao Cliente',
          content: 'Olá {nome}! Seja muito bem-vindo(a) à nossa equipe. Como posso te ajudar hoje?',
          category: 'GERAL',
        },
        {
          shortcut: '/lembrete',
          title: 'Lembrete de Agendamento',
          content: 'Olá {nome}! Passando para lembrar do seu agendamento hoje. Confirmado?',
          category: 'AGENDAMENTO',
        },
        {
          shortcut: '/pix',
          title: 'Dados Chave PIX',
          content: 'Olá {nome}! Nossa chave PIX para pagamento é o CNPJ: 12.345.678/0001-90. Por favor envie o comprovante por aqui!',
          category: 'FINANCEIRO',
        },
        {
          shortcut: '/tabela',
          title: 'Tabela de Serviços',
          content: 'Olá {nome}! Nossos principais serviços incluem: Corte Masculino (R$ 40), Barba (R$ 30) e Combo Completo (R$ 60). Acesse nosso catálogo para ver todos!',
          category: 'PROMOCAO',
        },
        {
          shortcut: '/agradecimento',
          title: 'Agradecimento pós-atendimento',
          content: 'Muito obrigado pela preferência, {nome}! Foi um prazer te atender. Até a próxima!',
          category: 'GERAL',
        },
      ];

      for (const tmpl of defaultTemplates) {
        await prisma.quickReplyTemplate.create({
          data: {
            ...tmpl,
            adminId: user.id,
          },
        });
      }

      templates = await prisma.quickReplyTemplate.findMany({
        where: { adminId: user.id },
        orderBy: { shortcut: 'asc' },
      });
    }

    return templates;
  });

  // POST /api/admin/crm-chat/templates — Create quick reply template
  app.post('/templates', async (request, reply) => {
    const user = request.user as { id: number };
    let { shortcut, title, content, category } = request.body as {
      shortcut: string;
      title: string;
      content: string;
      category?: string;
    };

    if (!shortcut?.trim() || !title?.trim() || !content?.trim()) {
      return reply.status(400).send({ error: 'Atalho, título e conteúdo são obrigatórios' });
    }

    shortcut = shortcut.trim();
    if (!shortcut.startsWith('/')) {
      shortcut = '/' + shortcut;
    }

    const template = await prisma.quickReplyTemplate.create({
      data: {
        adminId: user.id,
        shortcut,
        title: title.trim(),
        content: content.trim(),
        category: category || 'GERAL',
      },
    });

    return reply.status(201).send(template);
  });

  // PUT /api/admin/crm-chat/templates/:id — Edit template
  app.put('/templates/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    let { shortcut, title, content, category } = request.body as {
      shortcut?: string;
      title?: string;
      content?: string;
      category?: string;
    };

    const tmplId = parseInt(id);
    if (isNaN(tmplId)) {
      return reply.status(400).send({ error: 'ID do modelo inválido' });
    }

    const tmpl = await prisma.quickReplyTemplate.findFirst({
      where: { id: tmplId, adminId: user.id },
    });

    if (!tmpl) {
      return reply.status(404).send({ error: 'Modelo não encontrado' });
    }

    if (shortcut) {
      shortcut = shortcut.trim();
      if (!shortcut.startsWith('/')) shortcut = '/' + shortcut;
    }

    const updated = await prisma.quickReplyTemplate.update({
      where: { id: tmplId },
      data: {
        ...(shortcut && { shortcut }),
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() }),
        ...(category && { category }),
      },
    });

    return updated;
  });

  // DELETE /api/admin/crm-chat/templates/:id — Delete template
  app.delete('/templates/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const tmplId = parseInt(id);
    if (isNaN(tmplId)) {
      return reply.status(400).send({ error: 'ID do modelo inválido' });
    }

    const tmpl = await prisma.quickReplyTemplate.findFirst({
      where: { id: tmplId, adminId: user.id },
    });

    if (!tmpl) {
      return reply.status(404).send({ error: 'Modelo não encontrado' });
    }

    await prisma.quickReplyTemplate.delete({
      where: { id: tmplId },
    });

    return { success: true, message: 'Modelo excluído com sucesso' };
  });
}
