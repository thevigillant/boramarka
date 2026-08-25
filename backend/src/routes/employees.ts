import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import { authenticate } from '../plugins/auth';
import { checkAndUpdateSubscription, checkQuota } from '../services/subscription';
import { createAuditLog } from '../utils/auditLogger';
import { createEmployeeSchema } from '../utils/validators';

export default async function employeeRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authenticate);

  app.addHook('preHandler', async (request, reply) => {
    const user = request.user as { id: number; username?: string; role?: string; permissions?: Record<string, boolean> };
    
    // 🛡️ Validação de Permissão para Operadores
    if (user.role === 'operator' && !user.permissions?.canRh) {
      return reply.status(403).send({ error: 'Acesso negado. Seu perfil de operador não possui permissão para o módulo de RH.' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { username: true, role: true }
    });

    if (admin && (admin.role === 'superadmin' || admin.username === 'odonodoboramarka')) {
      return;
    }

    const sub = await checkAndUpdateSubscription(user.id);
    if (!sub || (sub.status !== 'trialing' && (sub.plan !== 'premium' || sub.status !== 'active'))) {
      return reply.status(403).send({ error: 'Gestão de RH é exclusiva do Plano Premium ativo ou do período de testes grátis.' });
    }
  });

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

    const employees = await prisma.employee.findMany({
      where,
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        paystubs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        vacationRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        accessLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        profileRequests: {
          where: { status: 'PENDING' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // 🛡️ Oculta hashes de senha e tokens das respostas da API
    return employees.map((emp: any) => {
      const { passwordHash: _, portalToken: __, ...safeEmp } = emp;
      return safeEmp;
    });
  });

  app.post('/', async (request, reply) => {
    const user = request.user as { id: number };

    const quota = await checkQuota(user.id, 'employees');
    if (!quota.allowed) {
      return reply.status(403).send({ error: quota.message });
    }
    
    const parsed = createEmployeeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }

    const {
      name, role, phone, email, cpf, rg, birthDate,
      admissionDate, salary, commission, workingHours, password, address
    } = parsed.data;

    const portalToken = uuidv4().substring(0, 12);
    const passwordHash = password?.trim() ? await bcrypt.hash(password.trim(), 10) : '';

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
        passwordHash,
        portalToken,
        portalActive: true,
        address: address || '',
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

    const { passwordHash: _, portalToken: __, ...safeEmployee } = employee;
    return reply.status(201).send(safeEmployee);
  });

  app.put('/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const {
      name, role, phone, email, cpf, rg, birthDate,
      admissionDate, salary, commission, workingHours, status, address
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
          ...(address !== undefined && { address }),
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

  app.put('/:id/resolve-pending', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    try {
      const updated = await prisma.employee.update({
        where: { id: parseInt(id), adminId: user.id },
        data: {
          pendingResolved: true,
        },
      });

      await createAuditLog(request, {
        action: 'RESOLVE_EMPLOYEE_PENDING',
        entity: 'EMPLOYEE',
        entityId: updated.id,
        details: `Resolveu a pendência do colaborador desligado "${updated.name}"`,
        adminId: user.id,
      });

      return updated;
    } catch (error) {
      return reply.status(404).send({ error: 'Colaborador não encontrado' });
    }
  });

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

  app.post('/:id/reset-password', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { password } = request.body as { password: string };

    if (!password || password.length < 4) {
      return reply.status(400).send({ error: 'A nova senha deve ter pelo menos 4 caracteres.' });
    }

    const emp = await prisma.employee.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!emp) return reply.status(404).send({ error: 'Colaborador não encontrado.' });

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    await prisma.employee.update({
      where: { id: emp.id },
      data: { passwordHash },
    });

    await createAuditLog(request, {
      action: 'RESET_EMPLOYEE_PASSWORD',
      entity: 'EMPLOYEE',
      entityId: emp.id,
      details: `Redefiniu a senha do Portal do colaborador "${emp.name}"`,
      adminId: user.id,
    });

    return { success: true, message: `Senha do colaborador "${emp.name}" redefinida com sucesso!` };
  });

  app.put('/:id/toggle-portal', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { portalActive } = request.body as { portalActive: boolean };

    const emp = await prisma.employee.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!emp) return reply.status(404).send({ error: 'Colaborador não encontrado.' });

    const updated = await prisma.employee.update({
      where: { id: emp.id },
      data: { portalActive: Boolean(portalActive) },
    });

    await createAuditLog(request, {
      action: 'TOGGLE_EMPLOYEE_PORTAL',
      entity: 'EMPLOYEE',
      entityId: emp.id,
      details: `${portalActive ? 'Desbloqueou' : 'Bloqueou'} o acesso ao Portal do colaborador "${emp.name}"`,
      adminId: user.id,
    });

    return updated;
  });

  app.post('/:id/generate-portal-link', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const emp = await prisma.employee.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!emp) return reply.status(404).send({ error: 'Colaborador não encontrado.' });

    let token = emp.portalToken;
    if (!token) {
      token = uuidv4().substring(0, 12);
      await prisma.employee.update({
        where: { id: emp.id },
        data: { portalToken: token },
      });
    }

    return {
      token,
      employeeId: emp.id,
      employeeName: emp.name,
    };
  });

  app.get('/:id/access-logs', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const logs = await prisma.employeeAccessLog.findMany({
      where: {
        employeeId: parseInt(id),
        employee: { adminId: user.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs;
  });

  app.get('/paystubs', async (request) => {
    const user = request.user as { id: number };
    return prisma.employeePaystub.findMany({
      where: { employee: { adminId: user.id } },
      include: { employee: { select: { id: true, name: true, role: true, cpf: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/paystubs', async (request, reply) => {
    const user = request.user as { id: number };
    const { employeeId, referenceMonth, grossSalary, netSalary, discounts, fileUrl, fileName, notes } = request.body as {
      employeeId: number;
      referenceMonth: string;
      grossSalary?: number;
      netSalary?: number;
      discounts?: number;
      fileUrl?: string;
      fileName?: string;
      notes?: string;
    };

    if (!employeeId || !referenceMonth) {
      return reply.status(400).send({ error: 'Colaborador e Mês de Referência (MM/YYYY) são obrigatórios.' });
    }

    const emp = await prisma.employee.findFirst({
      where: { id: employeeId, adminId: user.id },
    });

    if (!emp) return reply.status(404).send({ error: 'Colaborador não encontrado.' });

    const paystub = await prisma.employeePaystub.create({
      data: {
        employeeId: emp.id,
        referenceMonth,
        grossSalary: grossSalary !== undefined ? parseFloat(grossSalary as any) : emp.salary,
        netSalary: netSalary !== undefined ? parseFloat(netSalary as any) : emp.salary,
        discounts: discounts !== undefined ? parseFloat(discounts as any) : 0,
        fileUrl: fileUrl || '',
        fileName: fileName || `Holerite_${referenceMonth.replace('/', '-')}_${emp.name.replace(/\s+/g, '_')}.pdf`,
        notes: notes || '',
        signed: false,
      },
    });

    await createAuditLog(request, {
      action: 'CREATE_PAYSTUB',
      entity: 'PAYSTUB',
      entityId: paystub.id,
      details: `Publicou holerite de ${referenceMonth} para o colaborador "${emp.name}"`,
      adminId: user.id,
    });

    return reply.status(201).send(paystub);
  });

  app.delete('/paystubs/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const paystub = await prisma.employeePaystub.findFirst({
      where: { id: parseInt(id), employee: { adminId: user.id } },
    });

    if (!paystub) return reply.status(404).send({ error: 'Holerite não encontrado.' });

    await prisma.employeePaystub.delete({ where: { id: paystub.id } });
    return reply.status(204).send();
  });

  app.get('/announcements', async (request) => {
    const user = request.user as { id: number };
    return prisma.employeeAnnouncement.findMany({
      where: { adminId: user.id },
      include: {
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/announcements', async (request, reply) => {
    const user = request.user as { id: number };
    const { title, content, targetGroup, priority } = request.body as {
      title: string;
      content: string;
      targetGroup?: string;
      priority?: string;
    };

    if (!title?.trim() || !content?.trim()) {
      return reply.status(400).send({ error: 'Título e conteúdo são obrigatórios.' });
    }

    const announcement = await prisma.employeeAnnouncement.create({
      data: {
        adminId: user.id,
        title: title.trim(),
        content: content.trim(),
        targetGroup: targetGroup || 'ALL',
        priority: priority || 'NORMAL',
      },
    });

    await createAuditLog(request, {
      action: 'CREATE_ANNOUNCEMENT',
      entity: 'ANNOUNCEMENT',
      entityId: announcement.id,
      details: `Publicou o comunicado "${title}" para ${targetGroup || 'toda a equipe'}`,
      adminId: user.id,
    });

    return reply.status(201).send(announcement);
  });

  app.delete('/announcements/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const announcement = await prisma.employeeAnnouncement.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!announcement) return reply.status(404).send({ error: 'Comunicado não encontrado.' });

    await prisma.employeeAnnouncement.delete({ where: { id: announcement.id } });
    return reply.status(204).send();
  });

  app.get('/vacation-requests', async (request) => {
    const user = request.user as { id: number };
    return prisma.employeeVacationRequest.findMany({
      where: { employee: { adminId: user.id } },
      include: { employee: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.put('/vacation-requests/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { status, adminNotes } = request.body as { status: 'APPROVED' | 'REJECTED'; adminNotes?: string };

    const vacation = await prisma.employeeVacationRequest.findFirst({
      where: { id: parseInt(id), employee: { adminId: user.id } },
      include: { employee: true },
    });

    if (!vacation) return reply.status(404).send({ error: 'Solicitação não encontrada.' });

    const updated = await prisma.employeeVacationRequest.update({
      where: { id: vacation.id },
      data: {
        status,
        adminNotes: adminNotes || '',
      },
    });

    await createAuditLog(request, {
      action: 'UPDATE_VACATION_STATUS',
      entity: 'VACATION',
      entityId: vacation.id,
      details: `Solicitação de férias do colaborador "${vacation.employee.name}" foi ${status === 'APPROVED' ? 'Aprovada' : 'Rejeitada'}`,
      adminId: user.id,
    });

    return updated;
  });

  app.get('/profile-requests', async (request) => {
    const user = request.user as { id: number };
    return prisma.employeeProfileRequest.findMany({
      where: { employee: { adminId: user.id } },
      include: { employee: { select: { id: true, name: true, phone: true, email: true, address: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.put('/profile-requests/:id', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { status, adminNotes } = request.body as { status: 'APPROVED' | 'REJECTED'; adminNotes?: string };

    const req = await prisma.employeeProfileRequest.findFirst({
      where: { id: parseInt(id), employee: { adminId: user.id } },
      include: { employee: true },
    });

    if (!req) return reply.status(404).send({ error: 'Solicitação não encontrada.' });

    const updatedReq = await prisma.employeeProfileRequest.update({
      where: { id: req.id },
      data: {
        status,
        adminNotes: adminNotes || '',
      },
    });

    if (status === 'APPROVED') {
      await prisma.employee.update({
        where: { id: req.employeeId },
        data: {
          ...(req.phone && { phone: req.phone }),
          ...(req.email && { email: req.email }),
          ...(req.address && { address: req.address }),
        },
      });
    }

    await createAuditLog(request, {
      action: 'APPROVE_PROFILE_REQUEST',
      entity: 'PROFILE_REQUEST',
      entityId: req.id,
      details: `${status === 'APPROVED' ? 'Aprovou' : 'Rejeitou'} a atualização cadastral do colaborador "${req.employee.name}"`,
      adminId: user.id,
    });

    return updatedReq;
  });

  app.get('/:id/time-registers', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };

    const emp = await prisma.employee.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!emp) return reply.status(404).send({ error: 'Colaborador não encontrado.' });

    const registers = await prisma.employeeTimeRegister.findMany({
      where: { employeeId: emp.id },
      orderBy: { date: 'desc' },
    });

    return registers;
  });

  app.post('/:id/time-registers', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const { date, entry1, exit1, entry2, exit2, totalHours, extraHours, delayMinutes, absence, absenceReason, notes } = request.body as any;

    if (!date) return reply.status(400).send({ error: 'A data (YYYY-MM-DD) é obrigatória.' });

    const emp = await prisma.employee.findFirst({
      where: { id: parseInt(id), adminId: user.id },
    });

    if (!emp) return reply.status(404).send({ error: 'Colaborador não encontrado.' });

    let register = await prisma.employeeTimeRegister.findFirst({
      where: { employeeId: emp.id, date },
    });

    if (register) {
      register = await prisma.employeeTimeRegister.update({
        where: { id: register.id },
        data: {
          entry1: entry1 !== undefined ? entry1 : register.entry1,
          exit1: exit1 !== undefined ? exit1 : register.exit1,
          entry2: entry2 !== undefined ? entry2 : register.entry2,
          exit2: exit2 !== undefined ? exit2 : register.exit2,
          totalHours: totalHours !== undefined ? parseFloat(totalHours) : register.totalHours,
          extraHours: extraHours !== undefined ? parseFloat(extraHours) : register.extraHours,
          delayMinutes: delayMinutes !== undefined ? parseInt(delayMinutes) : register.delayMinutes,
          absence: absence !== undefined ? Boolean(absence) : register.absence,
          absenceReason: absenceReason !== undefined ? absenceReason : register.absenceReason,
          notes: notes !== undefined ? notes : register.notes,
        },
      });
    } else {
      register = await prisma.employeeTimeRegister.create({
        data: {
          employeeId: emp.id,
          date,
          entry1: entry1 || '',
          exit1: exit1 || '',
          entry2: entry2 || '',
          exit2: exit2 || '',
          totalHours: totalHours !== undefined ? parseFloat(totalHours) : 0,
          extraHours: extraHours !== undefined ? parseFloat(extraHours) : 0,
          delayMinutes: delayMinutes !== undefined ? parseInt(delayMinutes) : 0,
          absence: Boolean(absence),
          absenceReason: absenceReason || '',
          notes: notes || '',
          status: 'APPROVED',
        },
      });
    }

    return register;
  });

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

  app.post('/:id/documents', async (request, reply) => {
    const user = request.user as { id: number };
    const { id } = request.params as { id: string };
    const empId = parseInt(id);

    if (isNaN(empId)) {
      return reply.status(400).send({ error: 'ID do colaborador inválido' });
    }

    const { title, category, fileUrl, fileName, fileSize, expiryDate, notes, requiresSignature } = request.body as {
      title: string;
      category?: string;
      fileUrl: string;
      fileName?: string;
      fileSize?: string;
      expiryDate?: string;
      notes?: string;
      requiresSignature?: boolean;
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
          requiresSignature: Boolean(requiresSignature),
          signatureStatus: requiresSignature ? 'PENDING' : 'SIGNED',
          employeeId: employee.id,
        },
      });

      await createAuditLog(request, {
        action: 'ADD_DOCUMENT',
        entity: 'DOCUMENT',
        entityId: doc.id,
        details: `Anexou o documento "${title}" ao colaborador "${employee.name}"${requiresSignature ? ' (Requer assinatura eletrônica)' : ''}`,
        adminId: user.id,
      });

      return reply.status(201).send(doc);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Erro ao salvar o documento no servidor' });
    }
  });

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
