import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { sendWhatsAppMessage, generateBookingMessage } from '../services/whatsapp';

export default async function scheduleRoutes(app: FastifyInstance) {
  // GET /api/schedule/p/:username — Get public profile + services catalog
  app.get('/p/:username', async (request, reply) => {
    const { username } = request.params as { username: string };

    const admin = await prisma.admin.findUnique({
      where: { username },
      select: {
        id: true,
        businessName: true,
        description: true,
        photoUrl: true,
        phone: true,
        address: true,
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            description: true
          }
        }
      }
    });

    if (!admin) {
      return reply.status(404).send({ error: 'Profissional não encontrado' });
    }

    return {
      businessName: admin.businessName,
      description: admin.description,
      photoUrl: admin.photoUrl,
      phone: admin.phone,
      address: admin.address,
      services: admin.services
    };
  });

  // GET /api/schedule/:token — Get available slots for a scheduling link
  app.get('/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    const link = await prisma.schedulingLink.findUnique({
      where: { token },
      include: {
        timeSlots: {
          where: { isAvailable: true },
          orderBy: [{ date: 'asc' }, { time: 'asc' }],
          select: {
            id: true,
            date: true,
            time: true,
          },
        },
      },
    });

    if (!link) {
      return reply.status(404).send({ error: 'Link de agendamento não encontrado' });
    }

    // Group slots by date
    const slotsByDate: Record<string, { id: number; time: string }[]> = {};
    for (const slot of link.timeSlots) {
      if (!slotsByDate[slot.date]) {
        slotsByDate[slot.date] = [];
      }
      slotsByDate[slot.date].push({ id: slot.id, time: slot.time });
    }

    return {
      title: link.title,
      dates: Object.keys(slotsByDate).sort(),
      slotsByDate,
    };
  });

  // POST /api/schedule/:token/book — Book a time slot
  app.post('/:token/book', async (request, reply) => {
    const { token } = request.params as { token: string };
    const { timeSlotId, clientName, clientPhone } = request.body as {
      timeSlotId: number;
      clientName: string;
      clientPhone: string;
    };

    // Validate input
    if (!timeSlotId || !clientName?.trim() || !clientPhone?.trim()) {
      return reply.status(400).send({
        error: 'Nome, telefone e horário são obrigatórios',
      });
    }

    // Clean phone number (keep only digits)
    const cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 13) {
      return reply.status(400).send({
        error: 'Número de telefone inválido',
      });
    }

    // Verify the link exists
    const link = await prisma.schedulingLink.findUnique({
      where: { token },
    });
    if (!link) {
      return reply.status(404).send({ error: 'Link não encontrado' });
    }

    // Verify slot exists, belongs to this link, and is available
    const slot = await prisma.timeSlot.findFirst({
      where: {
        id: timeSlotId,
        linkId: link.id,
      },
    });

    if (!slot) {
      return reply.status(404).send({ error: 'Horário não encontrado' });
    }

    if (!slot.isAvailable) {
      return reply.status(409).send({ error: 'Este horário já foi reservado. Escolha outro.' });
    }

    // Create booking and mark slot as unavailable (atomic transaction)
    const booking = await prisma.$transaction(async (tx) => {
      // Double-check availability inside transaction
      const freshSlot = await tx.timeSlot.findUnique({ where: { id: timeSlotId } });
      if (!freshSlot?.isAvailable) {
        throw new Error('SLOT_TAKEN');
      }

      await tx.timeSlot.update({
        where: { id: timeSlotId },
        data: { isAvailable: false },
      });

      return tx.booking.create({
        data: {
          clientName: clientName.trim(),
          clientPhone: cleanPhone,
          timeSlotId,
        },
        include: {
          timeSlot: true,
        },
      });
    }).catch((err) => {
      if (err.message === 'SLOT_TAKEN') {
        return null;
      }
      throw err;
    });

    if (!booking) {
      return reply.status(409).send({ error: 'Este horário acabou de ser reservado. Escolha outro.' });
    }

    // Generate and send WhatsApp message
    const message = generateBookingMessage(
      clientName.trim(),
      booking.timeSlot.date,
      booking.timeSlot.time
    );
    const whatsappResult = await sendWhatsAppMessage(cleanPhone, message);

    return reply.status(201).send({
      booking: {
        id: booking.id,
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        date: booking.timeSlot.date,
        time: booking.timeSlot.time,
      },
      whatsapp: whatsappResult,
    });
  });
}
