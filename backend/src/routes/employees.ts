import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { checkAndUpdateSubscription } from '../services/subscription';
import { createAuditLog } from '../utils/auditLogger';

export default async function employeeRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  // Hook to check premium subscription for all operations
  app.addHook('preHandler', async (request, reply) => {
    const user = request.user as { id: number };
    const sub = await checkAndUpdateSubscription(user.id);
    if (!sub || sub.plan !== 'premium' || sub.status !== 'active') {
      return reply.status(403).send({ error: 'Gestão de RH é exclusiva do Plano Premium ativo.' });
    }
  });

  // GET /api/admin/employees — List employees with status & pending filters
  app.get('/', async (request) => {
    const user = request.user as { id: number };
    const { status, pendingType, pendingResolved } = request.query as {
      status?: string;
      pendingType?: string;
      pendingResolved?: string;
    };

    const where: any = { adminId: user.id };
    if (status) where.status = status;
    if (pendingType) where.pendingType = pendingType;
    if (pendingResolved !== undefined && pendingResolved !== '') {
      where.pendingResolved = pendingResolved === 'true';
    }

    return prisma.employee.findMany({
      where,
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  });

  // POST /api/admin/employees — Create employee
  app.post('/', async (request, reply) => {
    const user = request.user as { id: number };
    const {
      name, role, phone, email, cpf, rg, birthDate,
      admissionDate, salary, commission, workingHours
    } = request.body as {
      name: string;
      role: string;
      phone?: string;
      email?: string;
      cpf?: string;
      rg?: string;
      birthDate?: string;
      admissionDate?: string;
      salary?: number;
      commission?: number;
      workingHours?: string;
    };

    if (!name || !role) {
      return reply.status(400).send({ error: 'Nome e cargo são obrigatórios' });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        role,
        phone: phone || '',
        email: email || '',
        cpf: cpf || '',
        rg: rg || '',
        birthDate: birthDate || '',
        admissionDate: admissionDate || new Date().toISOString().split('T')[0],
        salary: salary !== undefined ? parseFloat(salary as any) : 0,
        commission: commission !== undefined ? parseFloat(commission as any) : 0,
        workingHours: workingHours || '',
        status: 'ACTIVE',
        adminId: user.id,
      },
    });

    await createAuditLog(request, {
      action: 'CREATE_EMPLOYEE',
      entity: 'EMPLOYEE',
      entityId: employee.id,
      details: `Cadastrou o colaborador "${name}" (Cargo: ${role})`,
      adminId: user.id,
    });

    return reply.status(201).send(employee);
  });

  // PUT /api/admin/employees/:id — Update employee profile
  app.put('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const {
      name, role, phone, email, cpf, rg, birthDate,
      admissionDate, salary, commission, workingHours, status
    } = request.body as any;

    try {
      const updated = await prisma.employee.update({
        where: { id: parseInt(id), adminId: user.id },
        data: {
          ...(name && { name }),
          ...(role && { role }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(cpf !== undefined && { cpf }),
          ...(rg !== undefined && { rg }),
          ...(birthDate !== undefined && { birthDate }),
          ...(admissionDate !== undefined && { admissionDate }),
          ...(salary !== undefined && { salary: parseFloat(salary) }),
          ...(commission !== undefined && { commission: parseFloat(commission) }),
          ...(workingHours !== undefined && { workingHours }),
          ...(status && { status }),
        },
      });

      await createAuditLog(request, {
        action: 'UPDATE_EMPLOYEE',
        entity: 'EMPLOYEE',
        entityId: updated.id,
        details: `Atualizou a ficha do colaborador "${updated.name}"`,
        adminId: user.id,
      });

      return updated;
    } catch (error) {
      return reply.status(404).send({ error: 'Colaborador não encontrado' });
    }
  });

  // POST /api/admin/employees/:id/dismiss — Dismiss employee
  app.post('/:id/dismiss', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const {
      dismissalDate, dismissalReason, dismissalNotes,
      pendingType, pendingNotes, pendingResolved
    } = request.body as {
      dismissalDate?: string;
      dismissalReason?: string;
      dismissalNotes?: string;
      pendingType?: string;
      pendingNotes?: string;
      pendingResolved?: boolean;
    };

    try {
      const updated = await prisma.employee.update({
        where: { id: parseInt(id), adminId: user.id },
        data: {
          status: 'DISMISSED',
          dismissalDate: dismissalDate || new Date().toISOString().split('T')[0],
          dismissalReason: dismissalReason || 'Não informado',
          dismissalNotes: dismissalNotes || '',
          pendingType: pendingType || 'OUTROS',
          pendingResolved: pendingResolved ?? false,
          pendingNotes: pendingNotes || '',
        },
      });

      await createAuditLog(request, {
        action: 'DISMISS_EMPLOYEE',
        entity: 'EMPLOYEE',
        entityId: updated.id,
        details: `Demitiu o colaborador "${updated.name}". Motivo: ${updated.dismissalReason}${updated.pendingType ? ` (Pendência: ${updated.pendingType})` : ''}`,
        adminId: user.id,
      });

      return updated;
    } catch (error) {
      return reply.status(404).send({ error: 'Colaborador não encontrado' });
    }
  });

  // PUT /api/admin/employees/:id/resolve-pending — Resolve pending issue
  app.put('/:id/resolve-pending', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { resolved } = request.body as { resolved?: boolean };

    try {
      const updated = await prisma.employee.update({
        where: { id: parseInt(id), adminId: user.id },
        data: {
          pendingResolved: resolved ?? true,
        },
      });

      await createAuditLog(request, {
        action: 'RESOLVE_PENDING',
        entity: 'EMPLOYEE',
        entityId: updated.id,
        details: `Marcou a pendência do ex-colaborador "${updated.name}" como ${resolved !== false ? 'RESOLVIDA' : 'ABERTA'}`,
        adminId: user.id,
      });

      return updated;
    } catch (error) {
      return reply.status(404).send({ error: 'Colaborador não encontrado' });
    }
  });

  // PUT /api/admin/employees/:id/archive — Move to Arquivo Morto
  app.put('/:id/archive', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      const updated = await prisma.employee.update({
        where: { id: parseInt(id), adminId: user.id },
        data: {
          status: 'ARCHIVED',
        },
      });

      await createAuditLog(request, {
        action: 'ARCHIVE_EMPLOYEE',
        entity: 'EMPLOYEE',
        entityId: updated.id,
        details: `Moveu o ex-colaborador "${updated.name}" para o Arquivo Morto`,
        adminId: user.id,
      });

      return updated;
    } catch (error) {
      return reply.status(404).send({ error: 'Colaborador não encontrado' });
    }
  });

  // PUT /api/admin/employees/:id/restore — Restore to Active Staff
  app.put('/:id/restore', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      const updated = await prisma.employee.update({
        where: { id: parseInt(id), adminId: user.id },
        data: {
          status: 'ACTIVE',
          pendingResolved: true,
        },
      });

      await createAuditLog(request, {
        action: 'RESTORE_EMPLOYEE',
        entity: 'EMPLOYEE',
        entityId: updated.id,
        details: `Reativou o colaborador "${updated.name}" para a Equipe Ativa`,
        adminId: user.id,
      });

      return updated;
    } catch (error) {
      return reply.status(404).send({ error: 'Colaborador não encontrado' });
    }
  });

  // DELETE /api/admin/employees/:id — Delete employee
  app.delete('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      const empToDelete = await prisma.employee.findFirst({
        where: { id: parseInt(id), adminId: user.id },
      });

      await prisma.employee.delete({
        where: { id: parseInt(id), adminId: user.id },
      });

      await createAuditLog(request, {
        action: 'DELETE_EMPLOYEE',
        entity: 'EMPLOYEE',
        entityId: id,
        details: `Excluiu permanentemente o registro do colaborador "${empToDelete?.name || id}"`,
        adminId: user.id,
      });

      return reply.status(204).send();
    } catch (error) {
      return reply.status(404).send({ error: 'Colaborador não encontrado' });
    }
  });

  // ═══ Employee Documents Routes ═══

  // GET /api/admin/employees/:id/documents — List documents of employee
  app.get('/:id/documents', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const empId = parseInt(id);

    if (isNaN(empId)) {
      return reply.status(400).send({ error: 'ID do colaborador inválido' });
    }

    try {
      const employee = await prisma.employee.findFirst({
        where: { id: empId, adminId: user.id },
      });

      if (!employee) {
        return reply.status(404).send({ error: 'Colaborador não encontrado' });
      }

      return await prisma.employeeDocument.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro interno ao buscar documentos' });
    }
  });

  // POST /api/admin/employees/:id/documents — Add document to employee
  app.post('/:id/documents', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const empId = parseInt(id);

    if (isNaN(empId)) {
      return reply.status(400).send({ error: 'ID do colaborador inválido' });
    }

    const { title, category, fileUrl, fileName, fileSize, expiryDate, notes } = request.body as {
      title: string;
      category?: string;
      fileUrl: string;
      fileName?: string;
      fileSize?: string;
      expiryDate?: string;
      notes?: string;
    };

    if (!title || !fileUrl) {
      return reply.status(400).send({ error: 'Título e arquivo são obrigatórios' });
    }

    try {
      const employee = await prisma.employee.findFirst({
        where: { id: empId, adminId: user.id },
      });

      if (!employee) {
        return reply.status(404).send({ error: 'Colaborador não encontrado' });
      }

      const doc = await prisma.employeeDocument.create({
        data: {
          title,
          category: category || 'GERAL',
          fileUrl,
          fileName: fileName || title,
          fileSize: fileSize || '',
          expiryDate: expiryDate || '',
          notes: notes || '',
          employeeId: employee.id,
        },
      });

      await createAuditLog(request, {
        action: 'ADD_DOCUMENT',
        entity: 'DOCUMENT',
        entityId: doc.id,
        details: `Anexou o documento "${title}" ao colaborador "${employee.name}"`,
        adminId: user.id,
      });

      return reply.status(201).send(doc);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao salvar o documento no servidor' });
    }
  });

  // DELETE /api/admin/employees/documents/:docId — Delete document
  app.delete('/documents/:docId', async (request, reply) => {
    const user = request.user as { id: number };
    const { docId } = request.params as { docId: string };
    const parsedDocId = parseInt(docId);

    if (isNaN(parsedDocId)) {
      return reply.status(400).send({ error: 'ID de documento inválido' });
    }

    try {
      const doc = await prisma.employeeDocument.findFirst({
        where: {
          id: parsedDocId,
          employee: { adminId: user.id },
        },
        include: { employee: true },
      });

      if (!doc) {
        return reply.status(404).send({ error: 'Documento não encontrado' });
      }

      await prisma.employeeDocument.delete({
        where: { id: doc.id },
      });

      await createAuditLog(request, {
        action: 'DELETE_DOCUMENT',
        entity: 'DOCUMENT',
        entityId: doc.id,
        details: `Excluiu o documento "${doc.title}" do colaborador "${doc.employee.name}"`,
        adminId: user.id,
      });

      return reply.status(204).send();
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao excluir o documento' });
    }
  });
}
