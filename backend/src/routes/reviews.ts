import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { submitReviewSchema, moderateReviewSchema } from '../utils/validators';

export default async function reviewRoutes(app: FastifyInstance) {
  // ═══════════════════════════════════════════════════════════
  // 1. PUBLIC ENDPOINTS (SEM AUTH)
  // ═══════════════════════════════════════════════════════════

  // GET /api/reviews/public/:adminId — Lista avaliações aprovadas + estatísticas
  app.get('/public/:adminId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { adminId } = request.params as { adminId: string };
    const parsedAdminId = parseInt(adminId);

    if (isNaN(parsedAdminId)) {
      return reply.status(400).send({ error: 'ID do administrador inválido' });
    }

    const reviews = await prisma.serviceReview.findMany({
      where: {
        adminId: parsedAdminId,
        approved: true,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Calcula média e totais
    const totalReviews = reviews.length;
    let averageRating: number | null = null;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        return acc + r.rating;
      }, 0);
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    // Mascara o telefone do cliente para privacidade (ex: (11) 9****-1234)
    const sanitizedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      clientName: r.clientName,
      serviceName: r.service?.name || 'Serviço',
      createdAt: r.createdAt,
    }));

    return {
      averageRating,
      totalReviews,
      distribution,
      reviews: sanitizedReviews,
    };
  });

  // POST /api/reviews/submit — Submissão de avaliação pelo cliente após agendamento
  app.post('/submit', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = submitReviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    const { bookingId, clientPhone, rating, comment } = parsed.data;

    // Busca o agendamento
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        timeSlot: {
          include: {
            link: {
              include: {
                service: true,
                admin: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return reply.status(404).send({ error: 'Agendamento não encontrado.' });
    }

    // Valida se o telefone bate com o agendamento
    const cleanReqPhone = clientPhone.replace(/\D/g, '');
    const cleanBookingPhone = booking.clientPhone.replace(/\D/g, '');

    if (cleanReqPhone !== cleanBookingPhone && !cleanBookingPhone.endsWith(cleanReqPhone) && !cleanReqPhone.endsWith(cleanBookingPhone)) {
      return reply.status(403).send({ error: 'O telefone informado não confere com o agendamento.' });
    }

    // Verifica se já existe avaliação para este agendamento
    const existing = await prisma.serviceReview.findUnique({
      where: { bookingId },
    });

    if (existing) {
      return reply.status(400).send({ error: 'Este agendamento já foi avaliado anteriormente. Obrigado!' });
    }

    const serviceId = booking.timeSlot.link.serviceId;
    const adminId = booking.timeSlot.link.adminId;

    if (!serviceId) {
      return reply.status(400).send({ error: 'Não foi possível vincular o serviço a este agendamento.' });
    }

    const review = await prisma.serviceReview.create({
      data: {
        bookingId,
        rating,
        comment: comment?.trim() || '',
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        serviceId,
        adminId,
        approved: true, // Aprovado por padrão
      },
      include: {
        service: { select: { name: true } },
      },
    });

    return reply.status(201).send({
      message: 'Avaliação enviada com sucesso! Obrigado pelo seu feedback.',
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        clientName: review.clientName,
        serviceName: review.service.name,
        createdAt: review.createdAt,
      },
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. ADMIN ENDPOINTS (COM AUTH)
  // ═══════════════════════════════════════════════════════════

  // GET /api/reviews/admin — Lista todas as avaliações do estabelecimento
  app.get('/admin', { preHandler: [authenticate] }, async (request: FastifyRequest) => {
    const user = request.user as { id: number };

    const reviews = await prisma.serviceReview.findMany({
      where: { adminId: user.id },
      include: {
        service: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.length;
    const avg = total > 0
      ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1))
      : null;

    return {
      averageRating: avg,
      totalReviews: total,
      reviews,
    };
  });

  // PATCH /api/reviews/:id/moderate — Modera aprovação de avaliação
  app.patch('/:id/moderate', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const reviewId = parseInt(id);

    const parsed = moderateReviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    const review = await prisma.serviceReview.findFirst({
      where: { id: reviewId, adminId: user.id },
    });

    if (!review) {
      return reply.status(404).send({ error: 'Avaliação não encontrada.' });
    }

    const updated = await prisma.serviceReview.update({
      where: { id: reviewId },
      data: { approved: parsed.data.approved },
    });

    return updated;
  });
}
