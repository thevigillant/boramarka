import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { v4 as uuidv4 } from 'uuid';
import { createAuditLog } from '../utils/auditLogger';

export default async function serviceRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // GET /api/services — List all services for the admin with their upsell recommendations
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    return prisma.service.findMany({
      where: { adminId: user.id },
      include: {
        mainUpsells: {
          include: {
            addonService: {
              select: {
                id: true,
                name: true,
                price: true,
                duration: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  });

  // POST /api/services — Create a new service and automatically create its scheduling link + upsell relations
  app.post('/', async (request, reply) => {
    const user = request.user as { id: number };
    const { name, description, price, duration, isUpsellable, upsellDiscount, addonServiceIds } = request.body as {
      name: string;
      description?: string;
      price: number;
      duration: number;
      isUpsellable?: boolean;
      upsellDiscount?: number;
      addonServiceIds?: number[];
    };

    if (!name || price === undefined || !duration) {
      return reply.status(400).send({ error: 'Nome, preço e duração são obrigatórios' });
    }

    const service = await prisma.$transaction(async (tx) => {
      const s = await tx.service.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          price,
          duration,
          isUpsellable: isUpsellable !== undefined ? isUpsellable : true,
          upsellDiscount: upsellDiscount || 0.0,
          adminId: user.id,
        },
      });

      // Link creation
      await tx.schedulingLink.create({
        data: {
          token: uuidv4(),
          title: name.trim(),
          serviceId: s.id,
          adminId: user.id,
        },
      });

      // Addon service relations (Upsell)
      if (Array.isArray(addonServiceIds) && addonServiceIds.length > 0) {
        await tx.serviceUpsell.createMany({
          data: addonServiceIds.map((addonId) => ({
            mainServiceId: s.id,
            addonServiceId: addonId,
          })),
        });
      }

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

  // PUT /api/services/:id — Update a service and its upsell relations
  app.put('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { name, description, price, duration, isUpsellable, upsellDiscount, addonServiceIds } = request.body as {
      name?: string;
      description?: string;
      price?: number;
      duration?: number;
      isUpsellable?: boolean;
      upsellDiscount?: number;
      addonServiceIds?: number[];
    };

    const serviceId = parseInt(id);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const s = await tx.service.update({
          where: { id: serviceId, adminId: user.id },
          data: {
            ...(name && { name: name.trim() }),
            ...(description !== undefined && { description: description?.trim() }),
            ...(price !== undefined && { price }),
            ...(duration !== undefined && { duration }),
            ...(isUpsellable !== undefined && { isUpsellable }),
            ...(upsellDiscount !== undefined && { upsellDiscount }),
          },
        });

        // Sync upsell addon relations if provided
        if (Array.isArray(addonServiceIds)) {
          // Delete existing relations
          await tx.serviceUpsell.deleteMany({
            where: { mainServiceId: serviceId },
          });

          // Create new relations
          if (addonServiceIds.length > 0) {
            await tx.serviceUpsell.createMany({
              data: addonServiceIds.map((addonId) => ({
                mainServiceId: serviceId,
                addonServiceId: addonId,
              })),
            });
          }
        }

        return s;
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

  // DELETE /api/services/:id — Delete a service
  app.delete('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      const serviceToDelete = await prisma.service.findFirst({
        where: { id: parseInt(id), adminId: user.id },
      });

      await prisma.$transaction(async (tx) => {
        await tx.schedulingLink.deleteMany({
          where: { serviceId: parseInt(id), adminId: user.id },
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
