"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const finance_1 = __importDefault(require("./routes/finance"));
const services_1 = __importDefault(require("./routes/services"));
const app = (0, fastify_1.default)({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true },
        },
    },
});
// CORS
app.register(cors_1.default, {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
});
// JWT
app.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
});
// Routes
app.register(auth_1.default, { prefix: '/api/auth' });
app.register(admin_1.default, { prefix: '/api/admin' });
app.register(schedule_1.default, { prefix: '/api/schedule' });
app.register(finance_1.default, { prefix: '/api/finance' });
app.register(services_1.default, { prefix: '/api/services' });
// Health check
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
// Start server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3001');
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
        console.log(`📋 API Health: http://localhost:${port}/api/health\n`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
