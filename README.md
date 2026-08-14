# 🚀 BoraMarka — Enterprise SaaS Platform for Automated Scheduling & Intelligent Business Management

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production_Ready-emerald?style=for-the-badge&logo=railway" alt="Status">
  <img src="https://img.shields.io/badge/Domain-boramarka.com.br-000000?style=for-the-badge&logo=googlechrome" alt="Domain">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_v4_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Validation-Zod_v3-3068B7?style=for-the-badge&logo=zod" alt="Zod">
  <img src="https://img.shields.io/badge/Database-PostgreSQL_17_%2B_Prisma_5-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Testing-Vitest_Suite-6E9F18?style=for-the-badge&logo=vitest" alt="Vitest">
  <img src="https://img.shields.io/badge/AI_Support-Instant_Auto--Responder-8B5CF6?style=for-the-badge&logo=openai" alt="AI Support">
  <img src="https://img.shields.io/badge/Payments-Mercado_Pago_API_v1-009EE3?style=for-the-badge&logo=mercadopago" alt="Mercado Pago">
  <img src="https://img.shields.io/badge/Security-RBAC_%2B_JWT_%2B_Helmet-violet?style=for-the-badge&logo=shield" alt="Security">
</p>

---

## 🌐 Official Production Endpoints

| Component | URL | Provider / Infrastructure |
| :--- | :--- | :--- |
| 🌐 **Web Platform (Production)** | [https://boramarka.com.br](https://boramarka.com.br) | Vercel Edge Global Network |
| ⚡ **API Server (REST Backend)** | [https://api.boramarka.com.br](https://api.boramarka.com.br) | Railway Enterprise Container |
| 📧 **Email Delivery Engine** | `noreply@boramarka.com.br` | Resend API HTTP (DKIM / SPF Verified) |
| 📦 **GitHub Repository** | [`thevigillant/boramarka`](https://github.com/thevigillant/boramarka) | Main Branch |

---

## 💡 System Architecture Overview

**BoraMarka** is an enterprise-grade multi-tenant SaaS platform built for service professionals, barbershops, beauty salons, health clinics, tattoo studios, and pet centers. It unifies online booking, automated client communications, revenue analytics, AI-assisted customer helpdesk, social proof review aggregation, and workforce operations.

```mermaid
graph TD
    Client["📱 Client & Admin Web Apps (React 18 + Vite)"] -->|HTTPS / REST API| Edge["🛡️ Vercel Edge / CDN"]
    Edge -->|DNS / Reverse Proxy| Server["⚡ Fastify Backend (TypeScript)"]
    
    subgraph Security & Validation Layer
        Server -->|Input Sanitization| Zod["🛡️ Zod Runtime Schema Validation"]
        Server -->|Authentication & RBAC| JWT["🔒 JWT + Fastify Rate Limit + Helmet"]
    end

    subgraph Service & Engine Layer
        Zod --> Bot["🤖 Helpdesk AI Auto-Responder & SLA Engine"]
        Zod --> Reviews["⭐ Verified Social Proof Reviews Engine"]
        Zod --> Analytics["📊 Analytics & Business Intelligence Engine"]
        Zod --> WA["💬 Multi-Channel WhatsApp Reminder Engine"]
        Zod --> MP["💳 Mercado Pago Split & Subscriptions"]
        Zod --> Email["📧 Resend HTTP Transactional Mailer"]
        Zod --> Push["🔔 VAPID Web Push Notifications"]
    end
    
    subgraph Data Persistence Layer
        Bot & Reviews & Analytics & WA & MP & Email & Push --> Prisma["💎 Prisma 5 ORM"]
        Prisma -->|ACID Transactions & Connection Pooling| DB[("🐘 PostgreSQL 17 Database")]
    end
```

---

## 💎 Core Capabilities & Engineering Highlights

### 🤖 Intelligent Helpdesk Auto-Responder & SLA Tracking Engine
- **Instant AI Assistant (`helpdeskBot.ts`)**: Natural-language intent resolution engine providing instant step-by-step guidance for PIX setup, Mercado Pago tokens, service combos, schedule configuration, WhatsApp automation, staff onboarding, and subscription billing.
- **Smart SLA Deadlines**: Automatic assignment of SLA timeframes (24h for Technical/Financial issues, 48h default) with real-time overdue alerts for operations managers.
- **CSAT Satisfaction Rating**: Integrated 5-star post-resolution feedback collection (`satisfactionRating`, `satisfactionComment`) and complete status transition audit logs (`SupportStatusLog`).
- **Rich Media & File Attachments**: Support for screenshots, PDFs, and diagnostic image attachments within tickets.

### ⭐ Verified Customer Reviews & Social Proof Engine
- **Post-Booking Feedback Loop**: Verified one-time rating collection (`1-5 Stars` + comment) linked to completed appointments via unique booking ID and client phone verification.
- **Public Profile Embedding**: Real-time average score and star breakdown seamlessly rendered on store landing pages (`/p/:username`).
- **Store-Level Moderation**: Administrator review oversight endpoint (`PATCH /api/reviews/:id/moderate`) allowing fine-grained control over public testimonials.

### 📊 Business Intelligence & Revenue Analytics Dashboard
- **Revenue Trajectory Analysis**: Month-over-month revenue comparisons and percentage growth velocity indicators.
- **Occupancy & Demand Heatmaps**: Booking distribution breakdown by day of the week to identify peak and idle operational windows.
- **Service Profitability Ranking**: Automated ranking of top revenue-generating services with transaction volume metrics.
- **Status Distribution Visualizers**: Visual segmentation of confirmed, paid, pending, and cancelled booking shares.

### 🛡️ Defense-in-Depth: Zod Runtime Schema Validation
- **Zero Insecure Casting**: All critical mutation endpoints (`/finance`, `/employees`, `/memberships`, `/loyalty`, `/crm-chat`, `/support`, `/portal`, `/services`, `/reviews`) validated via strict Zod schemas (`validators.ts`).
- **Descriptive Error Payloads**: User-friendly, localized validation messages with status `400` preventing corrupted records and SQL/NoSQL injection vectors.
- **Automated Regression Suite**: Comprehensive Vitest test harness validating edge-case inputs (invalid emails, malformed phone numbers, negative amounts, out-of-bounds ratings).

### 🧩 Modular Component & State Architecture
- **Deconstructed Monolith**: Refactored monolithic frontend dashboard into focused modules (`OverviewTab`, `NewTransactionModal`, `NewServiceModal`, `NewBookingModal`, `DeleteSlotModal`, `MpConfigModal`, `MpTutorialModal`).
- **Zero Layout Shifts**: Enhanced responsive CSS architecture with dark-mode neon aesthetics and smooth micro-interactions.

---

## 🏷️ Subscription Plans & Feature Matrix

| Feature / Resource | ⚡ **BoraTestar** | 📘 **BoraMensal** | 🔥 **BoraAnual** | 👑 **BoraPremium** |
| :--- | :---: | :---: | :---: | :---: |
| **Pricing** | **Free (7-day trial)** | **R$ 29.90 / mo** | **R$ 260.00 / yr** *(R$ 21.66/mo)* | **R$ 79.90 / mo** |
| **Monthly Bookings** | 50 (trial) | 500 / month | 2,500 / month | **Unlimited (∞)** |
| **Client Database** | 100 clients | 1,500 clients | 8,000 clients | **Unlimited (∞)** |
| **Staff Members** | 2 operators | 5 operators | 20 operators | **Unlimited (∞)** |
| **Services & Public Links** | 10 services / 2 links | 30 services / 10 links | 100 services / 30 links | **Unlimited (∞)** |
| **Mercado Pago Deposit** | ✅ Enabled | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| **AI Helpdesk Auto-Responder** | ✅ Enabled | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| **Social Proof Reviews** | ✅ Enabled | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| **Digital Loyalty Cards** | — | — | ✅ Enabled | ✅ Enabled |
| **HR & Employee Portal** | — | — | — | 👑 **Exclusive** |

---

## 🏗️ Technology Stack

| Layer | Technology | Key Specifications |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite 5, Tailwind CSS | SPA architecture, Lucide Icons, Glassmorphism, Theme Engine |
| **Backend API** | Fastify v4, TypeScript 5, Node.js | Low-overhead routing, Schema serialization, JWT, Rate Limiter, Helmet |
| **Validation** | Zod v3 | Runtime payload validation, Type inference, Sanitization |
| **Database & ORM** | PostgreSQL 17, Prisma 5 | High-concurrency ACID transactions, Schema migrations, Connection pooling |
| **Unit Testing** | Vitest | Sub-second test execution, Schema coverage, Mock assertions |
| **Email Infrastructure** | Resend API HTTP | Transactional DKIM/SPF authenticated email delivery (`boramarka.com.br`) |
| **WhatsApp Automation** | Meta Cloud API + Webhooks | Official Cloud API messaging with deep-link smart fallback |
| **Payment Gateway** | Mercado Pago SDK | PIX, Credit Card tokenization, Preapproval Webhooks |
| **Push Notifications** | Web Push / VAPID | Native browser notifications for desktop and mobile PWA |
| **Deployment & CI/CD** | Vercel (FE) + Railway (BE) | Global CDN edge network and containerized microservice deployments |

---

## 🔌 API Endpoint Directory

```
/api (and /api/v1)
├── /auth
│   ├── POST /send-verification-code    # 4-digit OTP email dispatch
│   ├── POST /verify-code               # OTP validation
│   ├── POST /register                  # Multi-tenant admin registration
│   ├── POST /login                     # Admin & Operator JWT authentication
│   ├── POST /forgot-password           # Password reset code dispatch
│   └── POST /reset-password            # Password update
├── /schedule
│   ├── GET  /p/:username               # Public profile with review stats
│   ├── GET  /by-host                   # Subdomain/Custom domain profile lookup
│   ├── POST /bookings                  # Public appointment reservation
│   └── GET  /admin/bookings            # Authenticated store bookings
├── /reviews
│   ├── GET   /public/:adminId          # Public approved reviews & rating average
│   ├── POST  /submit                   # Verified post-booking review submission
│   ├── GET   /admin                    # Authenticated store review dashboard
│   └── PATCH /:id/moderate             # Review moderation toggle
├── /services
│   ├── GET  /                          # Service catalog with upsell combos
│   ├── POST /                          # Zod-validated service creation
│   └── PUT  /:id                       # Service modification
├── /finance
│   ├── GET  /stats                     # Real-time cash flow & metrics
│   ├── GET  /transactions              # Filtered financial ledger
│   └── POST /transactions              # Zod-validated transaction creation
├── /support
│   ├── POST  /tickets                  # Ticket creation with instant AI auto-reply
│   ├── GET   /tickets                  # Support ticket list with SLA tags
│   ├── POST  /tickets/:id/messages     # Message reply with context-aware AI bot
│   ├── PATCH /tickets/:id/status       # Status change & audit logging
│   └── POST  /tickets/:id/satisfaction # 5-star CSAT satisfaction feedback
├── /analytics
│   └── GET  /                          # Monthly revenue, weekday heatmap, top services
├── /loyalty                            # Loyalty stamp actions & coupon rewards
├── /admin/crm-chat                     # Customer contacts, WhatsApp chat & templates
├── /admin/employees                    # Staff management, payroll & portal links
├── /portal                             # Employee portal auth, clock-in & vacation requests
└── /billing                            # Mercado Pago subscription checkouts & webhooks
```

---

## 🛠️ Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/thevigillant/boramarka.git
cd boramarka
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables in backend/.env
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boramarka"
# JWT_SECRET="your-super-secret-key"

npx prisma generate
npx prisma db push
npm run test           # Run Vitest test suite
npm run dev            # Starts Fastify on http://localhost:3001
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run build          # Validate TypeScript compilation
npm run dev            # Starts Vite dev server on http://localhost:5173
```

---

## 📄 License & Intellectual Property

This codebase is proprietary software owned and maintained by **BoraMarka** (Bruno Santana Reis). All rights reserved. Unauthorized copying or redistribution is strictly prohibited.
