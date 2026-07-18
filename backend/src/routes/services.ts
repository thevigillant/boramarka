import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { v4 as uuidv4 } from 'uuid';
import { createAuditLog } from '../utils/auditLogger';

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

  // POST /api/services — Create a new service and automatically create its scheduling link
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

    const service = await prisma.$transaction(async (tx) => {
      const s = await tx.service.create({
        data: {
          name,
          description,
          price,
          duration,
          adminId: user.id,
        },
      });

      await tx.schedulingLink.create({
        data: {
          token: uuidv4(),
          title: name,
          serviceId: s.id,
          adminId: user.id,
        }
      });

      return s;
    });

    await createAuditLog(request, {
      action: 'CREATE_SERVICE',
      entity: 'SERVICE',
      entityId: service.id,
      details: `Cadastrou o serviço "${service.name}" (R$ ${price.toFixed(2)}, ${duration} min)`,
      adminId: user.id,
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

      await createAuditLog(request, {
        action: 'UPDATE_SERVICE',
        entity: 'SERVICE',
        entityId: updated.id,
        details: `Atualizou os dados do serviço "${updated.name}"`,
        adminId: user.id,
      });

      return updated;
    } catch {
      return reply.status(404).send({ error: 'Serviço não encontrado' });
    }
  });

  // DELETE /api/services/:id — Delete a service and its automatically created scheduling link
  app.delete('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      const serviceToDelete = await prisma.service.findFirst({
        where: { id: parseInt(id), adminId: user.id },
      });

      await prisma.$transaction(async (tx) => {
        await tx.schedulingLink.deleteMany({
          where: { serviceId: parseInt(id), adminId: user.id }
        });
        
        await tx.service.delete({
          where: { id: parseInt(id), adminId: user.id },
        });
      });

      await createAuditLog(request, {
        action: 'DELETE_SERVICE',
        entity: 'SERVICE',
        entityId: id,
        details: `Excluiu o serviço "${serviceToDelete?.name || id}"`,
        adminId: user.id,
      });

      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ error: 'Serviço não encontrado' });
    }
  });
}
