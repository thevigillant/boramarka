import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import scheduleRoutes from './routes/schedule';
import financeRoutes from './routes/finance';
import serviceRoutes from './routes/services';
import billingRoutes from './routes/billing';
import superadminRoutes from './routes/superadmin';
import googleCalendarRoutes from './routes/googleCalendar';
import membershipRoutes from './routes/memberships';
import clientRoutes from './routes/clients';
import socialRoutes from './routes/social';
import employeeRoutes from './routes/employees';
import auditRoutes from './routes/audit';
import loyaltyRoutes from './routes/loyalty';
import securityRoutes from './routes/security';
import crmChatRoutes from './routes/crmChat';
import analyticsRoutes from './routes/analytics';
import supportRoutes from './routes/support';
import portalRoutes from './routes/portal';
import reviewRoutes from './routes/reviews';
import uploadRoutes from './routes/upload';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import orderSettingsRoutes from './routes/orderSettings';
import storefrontRoutes from './routes/storefront';
import queueRoutes from './routes/queue';
import inventoryRoutes from './routes/inventory';
import pdvRoutes from './routes/pdv';
import marketingRoutes from './routes/marketing';
import supplierRoutes from './routes/suppliers';
import purchaseRoutes from './routes/purchases';
import invoiceRoutes from './routes/invoices';
import shoppingListRoutes from './routes/shoppingLists';
import { startReminderService } from './services/reminder';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

// Garante que o diretório de uploads local exista
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════
// Global error handlers — segurança contra crashes silenciosos
// ═══════════════════════════════════════════════════════════
process.on('uncaughtException', async (error) => {
  console.error('💀 [FATAL] Uncaught Exception — o processo está em estado indefinido:');
  console.error(error);
  // Encerra graciosamente — Railway/container restartará o processo
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [WARN] Unhandled Promise Rejection:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  // Promises rejeitadas são recuperáveis — loga mas não encerra
});

// Augment Fastify JWT types
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: number;
      username: string;
      role: string;
      employeeId?: number;
      adminId?: number;
      operatorId?: number;
      roleTitle?: string;
      permissions?: any;
    };
    user: {
      id: number;
      username: string;
      role: string;
      employeeId?: number;
      adminId?: number;
      operatorId?: number;
      roleTitle?: string;
      permissions?: any;
    };
  }
}

const isDev = process.env.NODE_ENV !== 'production';

const app = Fastify({
  bodyLimit: 50 * 1024 * 1024, // 50MB limit for document uploads
  logger: isDev
    ? {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        level: 'warn',
        redact: ['headers.authorization', 'body.password', 'body.mpAccessToken'],
      },
});

// ═══ Global Fastify error handler (Pino Structured Logging) ═══
app.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;
  
  if (statusCode >= 500) {
    request.log.error({ err: error, reqId: request.id }, `💥 Error 500 on ${request.method} ${request.url}`);
  } else {
    request.log.warn({ statusCode, err: error.message }, `⚠️ Client Error ${statusCode} on ${request.method} ${request.url}`);
  }

  reply.status(statusCode).send({
    error: statusCode >= 500 ? 'Erro interno do servidor' : error.message,
  });
});

// 🛡️ Security Headers (HTTP Helmet)
app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'sameorigin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  hsts: isDev ? false : { maxAge: 31536000, includeSubDomains: true, preload: true },
});

// 🛡️ Rate Limiting (Proteção Anti Brute-force / DoS)
app.register(rateLimit, {
  max: 120, // no máximo 120 requisições por minuto por IP
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Muitas requisições. Por favor, aguarde um momento antes de tentar novamente.',
  }),
});

// 🛡️ CORS Controlado — modo seguro por padrão
const allowedOrigins = [
  'https://boramarka.com.br',
  'https://www.boramarka.com.br',
  'http://localhost:5173',
  'http://localhost:3000',
];

const isDevelopment = process.env.NODE_ENV === 'development';

app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || isDevelopment) {
      cb(null, true);
    } else {
      cb(new Error('Origem não permitida por políticas de segurança CORS'), false);
    }
  },
  credentials: true,
});

// 🛡️ Autenticação JWT com verificação de segredo
const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ [SEGURANÇA] JWT_SECRET padrão detectado em ambiente de produção!');
}

app.register(jwt, {
  secret: jwtSecret,
});

// 🖼️ Arquivos Estáticos / Uploads Locais
app.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
  decorateReply: false,
});

import pushRoutes from './routes/push';

// Routes (v1 API Prefix Support)
app.register(authRoutes, { prefix: '/api/auth' });
app.register(authRoutes, { prefix: '/api/v1/auth' });
app.register(adminRoutes, { prefix: '/api/admin' });
app.register(adminRoutes, { prefix: '/api/v1/admin' });
app.register(scheduleRoutes, { prefix: '/api/schedule' });
app.register(scheduleRoutes, { prefix: '/api/v1/schedule' });
app.register(pushRoutes, { prefix: '/api/push' });
app.register(pushRoutes, { prefix: '/api/v1/push' });
app.register(financeRoutes, { prefix: '/api/finance' });
app.register(financeRoutes, { prefix: '/api/v1/finance' });
app.register(serviceRoutes, { prefix: '/api/services' });
app.register(serviceRoutes, { prefix: '/api/v1/services' });
app.register(billingRoutes, { prefix: '/api/billing' });
app.register(billingRoutes, { prefix: '/api/v1/billing' });
app.register(superadminRoutes, { prefix: '/api/superadmin' });
app.register(superadminRoutes, { prefix: '/api/v1/superadmin' });
app.register(googleCalendarRoutes, { prefix: '/api/admin/google-calendar' });
app.register(googleCalendarRoutes, { prefix: '/api/v1/admin/google-calendar' });
app.register(membershipRoutes, { prefix: '/api/admin/memberships' });
app.register(membershipRoutes, { prefix: '/api/v1/admin/memberships' });
app.register(clientRoutes, { prefix: '/api/admin/clients' });
app.register(clientRoutes, { prefix: '/api/v1/admin/clients' });
app.register(socialRoutes, { prefix: '/api/admin/social' });
app.register(socialRoutes, { prefix: '/api/v1/admin/social' });
app.register(employeeRoutes, { prefix: '/api/admin/employees' });
app.register(employeeRoutes, { prefix: '/api/v1/admin/employees' });
app.register(auditRoutes, { prefix: '/api/admin/audit-logs' });
app.register(auditRoutes, { prefix: '/api/v1/admin/audit-logs' });
app.register(loyaltyRoutes, { prefix: '/api/loyalty' });
app.register(loyaltyRoutes, { prefix: '/api/v1/loyalty' });
app.register(securityRoutes, { prefix: '/api/security' });
app.register(securityRoutes, { prefix: '/api/v1/security' });
app.register(crmChatRoutes, { prefix: '/api/admin/crm-chat' });
app.register(crmChatRoutes, { prefix: '/api/v1/admin/crm-chat' });
app.register(analyticsRoutes, { prefix: '/api/admin/analytics' });
app.register(analyticsRoutes, { prefix: '/api/v1/admin/analytics' });
app.register(supportRoutes, { prefix: '/api/support' });
app.register(supportRoutes, { prefix: '/api/v1/support' });
app.register(portalRoutes, { prefix: '/api/portal' });
app.register(portalRoutes, { prefix: '/api/v1/portal' });
app.register(reviewRoutes, { prefix: '/api/reviews' });
app.register(reviewRoutes, { prefix: '/api/v1/reviews' });
app.register(uploadRoutes, { prefix: '/api/upload' });
app.register(uploadRoutes, { prefix: '/api/v1/upload' });
// 🍰 Módulo BoraEnkomenda
app.register(productRoutes, { prefix: '/api/products' });
app.register(productRoutes, { prefix: '/api/v1/products' });
app.register(orderRoutes, { prefix: '/api/orders' });
app.register(orderRoutes, { prefix: '/api/v1/orders' });
app.register(orderSettingsRoutes, { prefix: '/api/order-settings' });
app.register(orderSettingsRoutes, { prefix: '/api/v1/order-settings' });
app.register(storefrontRoutes, { prefix: '/api/store' });
app.register(storefrontRoutes, { prefix: '/api/v1/store' });
// 🛒 Listas de Compras de Produção (BoraEnkomenda)
app.register(shoppingListRoutes, { prefix: '/api/shopping-lists' });
app.register(shoppingListRoutes, { prefix: '/api/v1/shopping-lists' });
// 🚶 Fila de Espera Walk-in
app.register(queueRoutes, { prefix: '/api/queue' });
app.register(queueRoutes, { prefix: '/api/v1/queue' });
// 📦 Controle de Estoque
app.register(inventoryRoutes, { prefix: '/api/inventory' });
app.register(inventoryRoutes, { prefix: '/api/v1/inventory' });
// 🧾 PDV — Ponto de Venda
app.register(pdvRoutes, { prefix: '/api/pdv' });
app.register(pdvRoutes, { prefix: '/api/v1/pdv' });
// 📣 Campanhas de Marketing
app.register(marketingRoutes, { prefix: '/api/marketing' });
app.register(marketingRoutes, { prefix: '/api/v1/marketing' });
// 🏭 Fornecedores (por CNPJ), Compras & Notas Fiscais (Destrinchadas)
app.register(supplierRoutes, { prefix: '/api/suppliers' });
app.register(supplierRoutes, { prefix: '/api/v1/suppliers' });
app.register(purchaseRoutes, { prefix: '/api/purchases' });
app.register(purchaseRoutes, { prefix: '/api/v1/purchases' });
app.register(invoiceRoutes, { prefix: '/api/invoices' });
app.register(invoiceRoutes, { prefix: '/api/v1/invoices' });

const healthCheckHandler = async (request: any, reply: any) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  } catch (err: any) {
    reply.status(503);
    return {
      status: 'error',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }
};

app.get('/api/health', healthCheckHandler);
app.get('/api/v1/health', healthCheckHandler);



async function ensureSuperAdminExists() {
  try {
    const superadminUsername = 'odonodoboramarka';
    const fullPermissions = JSON.stringify({
      canManageUsers: true,
      canManageSubscriptions: true,
      canManageSuperAdmins: true,
      canAccessSupport: true,
      canViewFinancials: true,
    });

    let admin = await prisma.admin.findUnique({
      where: { username: superadminUsername },
    });

    if (!admin) {
      const superadminPassword = process.env.SUPERADMIN_PASSWORD;
      if (!superadminPassword) {
        console.warn('⚠️ [SUPERADMIN] SUPERADMIN_PASSWORD não definido no .env — conta SuperAdmin NÃO será criada. Defina a variável para inicializar.');
        return;
      }
      const passwordHash = await bcrypt.hash(superadminPassword, 10);
      admin = await prisma.admin.create({
        data: {
          username: superadminUsername,
          passwordHash,
          role: 'superadmin',
          businessName: 'BoraMarka Central SuperAdmin',
          category: 'admin',
          permissions: fullPermissions,
        },
      });
      console.log(`👑 [SUPERADMIN] Conta "${superadminUsername}" criada/inicializada com permissões totais.`);
    } else {
      admin = await prisma.admin.update({
        where: { username: superadminUsername },
        data: {
          role: 'superadmin',
          permissions: fullPermissions,
        },
      });
      console.log(`👑 [SUPERADMIN] Permissão 'superadmin' atualizada para "${superadminUsername}".`);
    }

    // Auto-garante assinatura ilimitada Master Premium permanente para o superadmin
    if (admin) {
      await prisma.subscription.upsert({
        where: { adminId: admin.id },
        create: {
          adminId: admin.id,
          status: 'active',
          plan: 'premium',
          trialEndsAt: null,
          expiresAt: null,
        },
        update: {
          status: 'active',
          plan: 'premium',
          trialEndsAt: null,
          expiresAt: null,
        },
      });
      console.log(`👑 [SUPERADMIN] Assinatura Master Ativa e Ilimitada garantida para "${superadminUsername}".`);
    }
  } catch (err: any) {
    console.error('⚠️ [SUPERADMIN] Falha ao verificar conta SuperAdmin:', err.message);
  }
}

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
    console.log(`📋 API Health: http://localhost:${port}/api/health\n`);
    
    // Auto-garante existência do usuário superadmin odonodoboramarka
    await ensureSuperAdminExists();

    // Inicia o serviço de lembretes automáticos por WhatsApp (com proteção)
    try {
      startReminderService();
    } catch (reminderError) {
      console.error('⚠️ Falha ao iniciar serviço de lembretes (servidor continua rodando):', reminderError);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// 🛡️ Graceful shutdown — fecha conexões do Prisma
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 [${signal}] Encerrando servidor graciosamente...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

start();
