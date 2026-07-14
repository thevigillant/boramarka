import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function clientRoutes(app: FastifyInstance) {
  // All routes require admin authentication
  app.addHook('onRequest', authenticate);

  // GET /api/admin/clients/:phone/history — Get past and future bookings for a specific client
  app.get('/:phone/history', async (request, reply) => {
    const user = request.user as { id: number };
    const { phone } = request.params as { phone: string };

    const cleanPhone = phone.replace(/\D/g, '');

    const bookings = await prisma.booking.findMany({
      where: {
        clientPhone: cleanPhone,
        timeSlot: {
          link: {
            adminId: user.id
          }
        }
      },
      include: {
        timeSlot: {
          include: {
            link: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    // Sort by slot date and time descending (newest first)
    bookings.sort((a, b) => {
      const aDateTime = `${a.timeSlot.date}T${a.timeSlot.time}`;
      const bDateTime = `${b.timeSlot.date}T${b.timeSlot.time}`;
      return bDateTime.localeCompare(aDateTime);
    });

    return bookings;
  });

  // GET /api/admin/clients/:phone/notes — Get annotations/prontuário for a specific client
  app.get('/:phone/notes', async (request) => {
    const user = request.user as { id: number };
    const { phone } = request.params as { phone: string };

    const cleanPhone = phone.replace(/\D/g, '');

    return prisma.clientNote.findMany({
      where: {
        clientPhone: cleanPhone,
        adminId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  });

  // POST /api/admin/clients/:phone/notes — Create a new note/annotation
  app.post('/:phone/notes', async (request, reply) => {
    const user = request.user as { id: number };
    const { phone } = request.params as { phone: string };
    const { content } = request.body as { content: string };

    if (!content?.trim()) {
      return reply.status(400).send({ error: 'O conteúdo da anotação não pode ser vazio' });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const note = await prisma.clientNote.create({
      data: {
        clientPhone: cleanPhone,
        content: content.trim(),
        adminId: user.id
      }
    });

    return reply.status(201).send(note);
  });

  // DELETE /api/admin/clients/notes/:id — Delete a specific note/annotation
  app.delete('/notes/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const note = await prisma.clientNote.findFirst({
      where: {
        id: parseInt(id),
        adminId: user.id
      }
    });

    if (!note) {
      return reply.status(404).send({ error: 'Anotação não encontrada' });
    }

    await prisma.clientNote.delete({
      where: { id: note.id }
    });

    return reply.status(204).send();
  });
}
