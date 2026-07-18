import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';

export default async function auditRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // GET /api/admin/audit-logs — List audit logs for current admin tenant
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    const { search, entity, action, severity } = request.query as {
      search?: string;
      entity?: string;
      action?: string;
      severity?: string;
    };

    const where: any = { adminId: user.id };

    if (entity && entity !== 'ALL') {
      where.entity = entity;
    }

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { details: { contains: q } },
        { userName: { contains: q } },
        { ipAddress: { contains: q } },
        { action: { contains: q } },
        { deviceInfo: { contains: q } },
      ];
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  });
}
