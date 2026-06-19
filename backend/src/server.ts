import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import scheduleRoutes from './routes/schedule';
import financeRoutes from './routes/finance';
import serviceRoutes from './routes/services';
import billingRoutes from './routes/billing';
import superadminRoutes from './routes/superadmin';

// Augment Fastify JWT types
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: number; username: string; role: string };
    user: { id: number; username: string; role: string };
  }
}

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

// CORS
app.register(cors, {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
});

// JWT
app.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
});

// Routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(adminRoutes, { prefix: '/api/admin' });
app.register(scheduleRoutes, { prefix: '/api/schedule' });
app.register(financeRoutes, { prefix: '/api/finance' });
app.register(serviceRoutes, { prefix: '/api/services' });
app.register(billingRoutes, { prefix: '/api/billing' });
app.register(superadminRoutes, { prefix: '/api/superadmin' });

// Health check
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
    console.log(`📋 API Health: http://localhost:${port}/api/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
