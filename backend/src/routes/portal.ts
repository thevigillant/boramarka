import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { portalLoginSchema, employeeVacationRequestSchema } from '../utils/validators';

export async function authenticateEmployee(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    const user = request.user as { employeeId: number; role: string };
    if (user.role !== 'employee') {
      return reply.status(403).send({ error: 'Acesso restrito ao Portal do Funcionário.' });
    }
  } catch (err) {
    return reply.status(401).send({ error: 'Sessão expirada. Faça login novamente no Portal.' });
  }
}

export default async function portalRoutes(app: FastifyInstance) {
  // ═══════════════════════════════════════════
  // 1. AUTENTICAÇÃO DO FUNCIONÁRIO (PÚBLICA)
  // ═══════════════════════════════════════════
  
  // POST /api/portal/login — Login via CPF/E-mail + Senha OU via Token direto
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = portalLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.issues[0].message });
    }
    const { token, login, password } = parsed.data;

    let employee = null;

    // A. Login por Token direto (Link de Acesso Gerado pelo RH)
    if (token?.trim()) {
      employee = await prisma.employee.findFirst({
        where: { portalToken: token.trim() },
        include: { admin: { select: { id: true, businessName: true, photoUrl: true } } },
      });

      if (!employee) {
        return reply.status(401).send({ error: 'Link de acesso inválido ou expirado. Peça um novo ao RH.' });
      }
    } else if (login?.trim() && password) {
      // B. Login por Credenciais (CPF ou E-mail) + Senha
      const cleanLogin = login.trim().toLowerCase();
      const cleanCpf = login.replace(/\D/g, '');

      // 🛡️ Prevenção contra Colisão de Contas Cross-Tenant: Busca estritamente por identificadores unívocos (Email ou CPF)
      const searchCriteria: any[] = [];
      if (cleanLogin.includes('@')) {
        searchCriteria.push({ email: cleanLogin });
      }
      if (cleanCpf.length === 11) {
        searchCriteria.push({ cpf: cleanCpf });
      }
      if (searchCriteria.length === 0) {
        searchCriteria.push({ email: cleanLogin });
        if (cleanCpf.length > 0) searchCriteria.push({ cpf: cleanCpf });
      }

      employee = await prisma.employee.findFirst({
        where: {
          OR: searchCriteria,
          status: 'ACTIVE',
        },
        include: { admin: { select: { id: true, businessName: true, photoUrl: true } } },
      });

      if (!employee) {
        return reply.status(401).send({ error: 'Funcionário não encontrado ou inativo. Verifique seu CPF ou e-mail.' });
      }

      if (!employee.passwordHash) {
        return reply.status(400).send({ error: 'Você ainda não possui uma senha cadastrada. Acesse pelo link seguro do RH ou peça para redefinir sua senha.' });
      }

      const validPassword = await bcrypt.compare(password, employee.passwordHash);
      if (!validPassword) {
        return reply.status(401).send({ error: 'Senha incorreta.' });
      }
    } else {
      return reply.status(400).send({ error: 'Forneça o token de acesso ou login e senha.' });
    }

    if (!employee.portalActive) {
      return reply.status(403).send({ error: 'Seu acesso ao Portal do Funcionário está temporariamente bloqueado pelo RH.' });
    }

    // Registra log de acesso
    const ipAddress = (request.headers['x-forwarded-for'] as string) || request.ip || '127.0.0.1';
    const userAgent = request.headers['user-agent'] || 'Browser';

    await prisma.employeeAccessLog.create({
      data: {
        employeeId: employee.id,
        ipAddress,
        userAgent,
        action: 'LOGIN',
      },
    });

    const jwtToken = app.jwt.sign(
      { id: employee.id, employeeId: employee.id, username: employee.name, adminId: employee.adminId, role: 'employee' },
      { expiresIn: '30d' }
    );

    return {
      token: jwtToken,
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        email: employee.email,
        phone: employee.phone,
        cpf: employee.cpf,
        rg: employee.rg,
        admissionDate: employee.admissionDate,
        workingHours: employee.workingHours,
        address: employee.address,
        companyName: employee.admin.businessName,
        companyLogo: employee.admin.photoUrl,
      },
    };
  });

  // ═══════════════════════════════════════════
  // ROTAS PROTEGIDAS PARA FUNCIONÁRIOS LOGADOS
  // ═══════════════════════════════════════════
  app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', authenticateEmployee);

    // GET /api/portal/me — Perfil completo do funcionário
    protectedApp.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any;
      const employee = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        include: {
          admin: { select: { businessName: true, photoUrl: true, phone: true, email: true } },
          _count: {
            select: {
              documents: { where: { signed: false, requiresSignature: true } },
              paystubs: { where: { signed: false } },
              vacationRequests: { where: { status: 'PENDING' } },
            },
          },
        },
      });

      if (!employee) {
        return reply.status(404).send({ error: 'Colaborador não encontrado.' });
      }

      // 🛡️ Oculta passwordHash e portalToken
      const { passwordHash: _, portalToken: __, ...safeEmployee } = employee;
      return safeEmployee;
    });

    // GET /api/portal/time-registers — Registros de ponto e espelho de jornada
    protectedApp.get('/time-registers', async (request: FastifyRequest) => {
      const user = request.user as any;
      const timeRegisters = await prisma.employeeTimeRegister.findMany({
        where: { employeeId: user.employeeId },
        orderBy: { date: 'desc' },
        take: 60,
      });

      // Cálculo consolidado de Banco de Horas / Horas Extras / Faltas
      let totalWorked = 0;
      let totalExtra = 0;
      let totalDelays = 0;
      let totalAbsences = 0;

      timeRegisters.forEach((tr) => {
        totalWorked += tr.totalHours;
        totalExtra += tr.extraHours;
        totalDelays += tr.delayMinutes;
        if (tr.absence) totalAbsences += 1;
      });

      return {
        timeRegisters,
        summary: {
          totalWorkedHours: Math.round(totalWorked * 10) / 10,
          totalExtraHours: Math.round(totalExtra * 10) / 10,
          totalDelayMinutes: totalDelays,
          totalAbsences,
        },
      };
    });

    // POST /api/portal/time-registers/punch — Batida de Ponto Direta
    protectedApp.post('/time-registers/punch', async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm

      let register = await prisma.employeeTimeRegister.findFirst({
        where: { employeeId: user.employeeId, date: todayStr },
      });

      if (!register) {
        register = await prisma.employeeTimeRegister.create({
          data: {
            employeeId: user.employeeId,
            date: todayStr,
            entry1: timeStr,
            status: 'APPROVED',
          },
        });
        return { message: `Ponto registrado (Entrada 1): ${timeStr}`, register };
      }

      if (!register.exit1) {
        register = await prisma.employeeTimeRegister.update({
          where: { id: register.id },
          data: { exit1: timeStr },
        });
        return { message: `Ponto registrado (Saída para Almoço): ${timeStr}`, register };
      }

      if (!register.entry2) {
        register = await prisma.employeeTimeRegister.update({
          where: { id: register.id },
          data: { entry2: timeStr },
        });
        return { message: `Ponto registrado (Retorno do Almoço): ${timeStr}`, register };
      }

      if (!register.exit2) {
        register = await prisma.employeeTimeRegister.update({
          where: { id: register.id },
          data: { exit2: timeStr },
        });
        return { message: `Ponto registrado (Saída 2): ${timeStr}`, register };
      }

      return reply.status(400).send({ error: 'Todas as 4 batidas de ponto de hoje já foram registradas.' });
    });

    // GET /api/portal/paystubs — Lista de Holerites
    protectedApp.get('/paystubs', async (request: FastifyRequest) => {
      const user = request.user as any;
      return prisma.employeePaystub.findMany({
        where: { employeeId: user.employeeId },
        orderBy: { createdAt: 'desc' },
      });
    });

    // POST /api/portal/paystubs/:id/sign — Assinatura Eletrônica de Holerite
    protectedApp.post('/paystubs/:id/sign', async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any;
      const { id } = request.params as { id: string };
      const paystubId = parseInt(id);

      const paystub = await prisma.employeePaystub.findFirst({
        where: { id: paystubId, employeeId: user.employeeId },
      });

      if (!paystub) {
        return reply.status(404).send({ error: 'Holerite não encontrado.' });
      }

      if (paystub.signed) {
        return reply.status(400).send({ error: 'Este holerite já foi assinado anteriormente.' });
      }

      const ipAddress = (request.headers['x-forwarded-for'] as string) || request.ip || '127.0.0.1';

      const updated = await prisma.employeePaystub.update({
        where: { id: paystubId },
        data: {
          signed: true,
          signedAt: new Date(),
          signatureIp: ipAddress,
        },
      });

      return { success: true, message: 'Holerite assinado eletronicamente com sucesso!', paystub: updated };
    });

    // GET /api/portal/documents — Lista de Documentos & Contratos
    protectedApp.get('/documents', async (request: FastifyRequest) => {
      const user = request.user as any;
      return prisma.employeeDocument.findMany({
        where: { employeeId: user.employeeId },
        orderBy: { createdAt: 'desc' },
      });
    });

    // POST /api/portal/documents/:id/sign — Assinatura/Recusa Eletrônica de Documento
    protectedApp.post('/documents/:id/sign', async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any;
      const { id } = request.params as { id: string };
      const { action, rejectionReason } = request.body as { action: 'SIGN' | 'REJECT'; rejectionReason?: string };
      const docId = parseInt(id);

      const doc = await prisma.employeeDocument.findFirst({
        where: { id: docId, employeeId: user.employeeId },
      });

      if (!doc) {
        return reply.status(404).send({ error: 'Documento não encontrado.' });
      }

      const ipAddress = (request.headers['x-forwarded-for'] as string) || request.ip || '127.0.0.1';

      if (action === 'REJECT') {
        const updated = await prisma.employeeDocument.update({
          where: { id: docId },
          data: {
            signed: false,
            signatureStatus: 'REJECTED',
            rejectionReason: rejectionReason?.trim() || 'Recusado pelo colaborador',
            signedAt: new Date(),
            signatureIp: ipAddress,
          },
        });
        return { success: true, message: 'Documento assinalado como recusado.', document: updated };
      }

      const updated = await prisma.employeeDocument.update({
        where: { id: docId },
        data: {
          signed: true,
          signatureStatus: 'SIGNED',
          signedAt: new Date(),
          signatureIp: ipAddress,
        },
      });

      return { success: true, message: 'Documento assinado eletronicamente com sucesso!', document: updated };
    });

    // GET /api/portal/vacations — Solicitações e Histórico de Férias/Licenças
    protectedApp.get('/vacations', async (request: FastifyRequest) => {
      const user = request.user as any;
      return prisma.employeeVacationRequest.findMany({
        where: { employeeId: user.employeeId },
        orderBy: { createdAt: 'desc' },
      });
    });

    // POST /api/portal/vacations — Solicitar Férias ou Licença
    protectedApp.post('/vacations', async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any;
      const parsed = employeeVacationRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const { type, startDate, endDate, daysCount, reason } = parsed.data;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const calculatedDays = daysCount || Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

      const vacationRequest = await prisma.employeeVacationRequest.create({
        data: {
          employeeId: user.employeeId,
          type: type || 'VACATION',
          startDate,
          endDate,
          daysCount: calculatedDays > 0 ? calculatedDays : 1,
          reason: reason?.trim() || '',
          status: 'PENDING',
        },
      });

      return reply.status(201).send({ message: 'Solicitação enviada ao RH com sucesso!', vacationRequest });
    });

    // GET /api/portal/announcements — Mural de Comunicados
    protectedApp.get('/announcements', async (request: FastifyRequest) => {
      const user = request.user as any;
      const employee = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { adminId: true, role: true },
      });

      if (!employee) return [];

      const announcements = await prisma.employeeAnnouncement.findMany({
        where: {
          adminId: employee.adminId,
          OR: [{ targetGroup: 'ALL' }, { targetGroup: employee.role }],
        },
        include: {
          reads: { where: { employeeId: user.employeeId } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Registra automaticamente como lido para o funcionário
      for (const a of announcements) {
        if (a.reads.length === 0) {
          await prisma.employeeAnnouncementRead.create({
            data: {
              announcementId: a.id,
              employeeId: user.employeeId,
            },
          }).catch(() => {});
        }
      }

      return announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        targetGroup: a.targetGroup,
        createdAt: a.createdAt,
        isRead: true,
      }));
    });

    // POST /api/portal/profile-request — Solicitação de alteração de dados cadastrais
    protectedApp.post('/profile-request', async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any;
      const { phone, email, address } = request.body as {
        phone?: string;
        email?: string;
        address?: string;
      };

      if (!phone?.trim() && !email?.trim() && !address?.trim()) {
        return reply.status(400).send({ error: 'Preencha ao menos um campo para alteração.' });
      }

      const profileReq = await prisma.employeeProfileRequest.create({
        data: {
          employeeId: user.employeeId,
          phone: phone?.trim() || '',
          email: email?.trim() || '',
          address: address?.trim() || '',
          status: 'PENDING',
        },
      });

      return reply.status(201).send({ message: 'Solicitação de alteração cadastral enviada para aprovação do RH!', request: profileReq });
    });
  });
}
