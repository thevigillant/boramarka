import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function serviceRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // GET /api/services — List all services for the admin
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    return prisma.service.findMany({
      where: { adminId: user.id },
      orderBy: { name: 'asc' },
    });
  });

  // POST /api/services — Create a new service
  app.post('/', async (request, reply) => {
    const user = request.user as { id: number };
    const { name, description, price, duration } = request.body as {
      name: string;
      description?: string;
      price: number;
      duration: number;
    };

    if (!name || price === undefined || !duration) {
      return reply.status(400).send({ error: 'Nome, preço e duração são obrigatórios' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price,
        duration,
        adminId: user.id,
      },
    });

    return reply.status(201).send(service);
  });

  // PUT /api/services/:id — Update a service
  app.put('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { name, description, price, duration } = request.body as {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
    };

    try {
      const updated = await prisma.service.update({
        where: { id: parseInt(id), adminId: user.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price }),
          ...(duration !== undefined && { duration }),
        },
      });
      return updated;
    } catch {
      return reply.status(404).send({ error: 'Serviço não encontrado' });
    }
  });

  // DELETE /api/services/:id — Delete a service
  app.delete('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      await prisma.service.delete({
        where: { id: parseInt(id), adminId: user.id },
      });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: 'Serviço não encontrado' });
    }
  });
}
