import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function marketingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // ── GET /api/marketing/campaigns — Listar campanhas ──────────────────
  app.get('/campaigns', async (request: FastifyRequest) => {
    const user = request.user as { id: number };

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { adminId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns;
  });

  // ── POST /api/marketing/campaigns — Criar campanha ────────────────────
  app.post('/campaigns', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { name, type, trigger, messageTemplate, segmentFilter, scheduledAt } = request.body as any;

    if (!name?.trim()) return reply.status(400).send({ error: 'Nome é obrigatório.' });
    if (!messageTemplate?.trim()) return reply.status(400).send({ error: 'Template de mensagem é obrigatório.' });

    const validTypes = ['REATIVACAO', 'ANIVERSARIO', 'INDICACAO', 'PROMOCAO'];
    if (!validTypes.includes(type)) return reply.status(400).send({ error: 'Tipo de campanha inválido.' });

    const campaign = await prisma.marketingCampaign.create({
      data: {
        adminId: user.id,
        name: name.trim(),
        type,
        trigger: trigger || 'MANUAL',
        messageTemplate: messageTemplate.trim(),
        segmentFilter: typeof segmentFilter === 'object' ? JSON.stringify(segmentFilter) : (segmentFilter || '{}'),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'DRAFT',
      },
    });

    return reply.status(201).send(campaign);
  });

  // ── PATCH /api/marketing/campaigns/:id — Atualizar campanha ──────────
  app.patch('/campaigns/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const campaignId = parseInt(id);
    const body = request.body as any;

    const campaign = await prisma.marketingCampaign.findFirst({
      where: { id: campaignId, adminId: user.id },
    });
    if (!campaign) return reply.status(404).send({ error: 'Campanha não encontrada.' });

    const updated = await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        name: body.name?.trim() || campaign.name,
        messageTemplate: body.messageTemplate?.trim() || campaign.messageTemplate,
        status: body.status || campaign.status,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : campaign.scheduledAt,
        segmentFilter: body.segmentFilter
          ? (typeof body.segmentFilter === 'object' ? JSON.stringify(body.segmentFilter) : body.segmentFilter)
          : campaign.segmentFilter,
      },
    });

    return updated;
  });

  // ── POST /api/marketing/campaigns/:id/send — Disparar campanha ────────
  app.post('/campaigns/:id/send', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const campaignId = parseInt(id);

    const campaign = await prisma.marketingCampaign.findFirst({
      where: { id: campaignId, adminId: user.id },
    });
    if (!campaign) return reply.status(404).send({ error: 'Campanha não encontrada.' });

    // Busca contatos com base no segmento
    let contacts: { phone: string; name: string }[] = [];

    const allContacts = await prisma.customerContact.findMany({
      where: { adminId: user.id },
      select: { phone: true, name: true, lastInteraction: true, status: true, tags: true },
    });

    if (campaign.type === 'REATIVACAO') {
      // Clientes sem interação há mais de 30 dias
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      contacts = allContacts
        .filter(c => !c.lastInteraction || new Date(c.lastInteraction) < cutoff)
        .map(c => ({ phone: c.phone, name: c.name }));
    } else if (campaign.type === 'ANIVERSARIO') {
      contacts = allContacts.map(c => ({ phone: c.phone, name: c.name }));
    } else {
      contacts = allContacts.map(c => ({ phone: c.phone, name: c.name }));
    }

    // Gera links de WhatsApp para disparo manual ou automatizado
    const adminInfo = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { businessName: true },
    });

    const whatsappLinks = contacts.slice(0, 50).map(c => {
      const personalizedMsg = campaign.messageTemplate
        .replace(/\{nome\}/gi, c.name)
        .replace(/\{loja\}/gi, adminInfo?.businessName || 'nossa loja');
      const cleanPhone = c.phone.replace(/\D/g, '');
      const link = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(personalizedMsg)}`;
      return { name: c.name, phone: c.phone, link };
    });

    // Atualiza status e contagem
    await prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'ACTIVE',
        sentCount: { increment: contacts.length },
      },
    });

    return {
      message: `Campanha pronta para disparar para ${contacts.length} cliente(s).`,
      totalContacts: contacts.length,
      whatsappLinks,
    };
  });

  // ── DELETE /api/marketing/campaigns/:id — Excluir campanha ───────────
  app.delete('/campaigns/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const campaignId = parseInt(id);

    const campaign = await prisma.marketingCampaign.findFirst({
      where: { id: campaignId, adminId: user.id },
    });
    if (!campaign) return reply.status(404).send({ error: 'Campanha não encontrada.' });

    await prisma.marketingCampaign.delete({ where: { id: campaignId } });
    return reply.status(204).send();
  });

  // ── GET /api/marketing/segments — Dados dos segmentos ────────────────
  app.get('/segments', async (request: FastifyRequest) => {
    const user = request.user as { id: number };

    const contacts = await prisma.customerContact.findMany({
      where: { adminId: user.id },
      select: { phone: true, name: true, lastInteraction: true, status: true, tags: true },
    });

    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);
    const cutoff60 = new Date();
    cutoff60.setDate(cutoff60.getDate() - 60);

    return {
      total: contacts.length,
      inactive30days: contacts.filter(c => !c.lastInteraction || new Date(c.lastInteraction) < cutoff30).length,
      inactive60days: contacts.filter(c => !c.lastInteraction || new Date(c.lastInteraction) < cutoff60).length,
      vip: contacts.filter(c => c.status === 'VIP' || (c.tags && c.tags.includes('VIP'))).length,
      frequent: contacts.filter(c => c.status === 'CONCLUIDO' || (c.tags && c.tags.includes('Fidelidade'))).length,
    };
  });
}
