# 🚀 BoraMarka — Enterprise SaaS Platform for Automated Scheduling & Intelligent Business Management

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production_Ready-emerald?style=for-the-badge&logo=railway" alt="Status">
  <img src="https://img.shields.io/badge/Domain-boramarka.com.br-000000?style=for-the-badge&logo=googlechrome" alt="Domain">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_v4_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Database-PostgreSQL_17_%2B_Prisma_5-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Email-Resend_API_HTTP-000000?style=for-the-badge&logo=resend" alt="Resend">
  <img src="https://img.shields.io/badge/WhatsApp-Meta_Cloud_API_%2B_HTTP_Gateway-25D366?style=for-the-badge&logo=whatsapp" alt="WhatsApp">
  <img src="https://img.shields.io/badge/Payments-Mercado_Pago_API_v1-009EE3?style=for-the-badge&logo=mercadopago" alt="Mercado Pago">
  <img src="https://img.shields.io/badge/Security-RBAC_%2B_JWT_%2B_Helmet-violet?style=for-the-badge&logo=shield" alt="Security">
</p>

---

## 🌐 Official Production Endpoints

| Component | URL | Provider / Infrastructure |
| :--- | :--- | :--- |
| 🌐 **Web Platform (Production)** | [https://boramarka.com.br](https://boramarka.com.br) | Vercel Edge Network |
| ⚡ **API Server (REST Backend)** | [https://api.boramarka.com.br](https://api.boramarka.com.br) | Railway Enterprise Cloud |
| 📧 **Email Delivery Engine** | `noreply@boramarka.com.br` | Resend API HTTP (DKIM / SPF Verified) |
| 📦 **GitHub Repository** | [`thevigillant/boramarka`](https://github.com/thevigillant/boramarka) | GitHub Private / Main Branch |

---

## 💡 System Architecture Overview

**BoraMarka** is an enterprise-grade multi-tenant SaaS platform built for service professionals, barbershops, beauty salons, health clinics, tattoo studios, and pet centers. It unifies online scheduling, automated multi-channel client engagement, recurrent subscription monetization, and real-time administrative operations.

```mermaid
graph TD
    Client["📱 Client / Web App (React 18 + Vite)"] -->|HTTPS / REST API| Edge["🛡️ Vercel Edge / CDN"]
    Edge -->|DNS / CNAME| Server["⚡ Fastify Backend (TypeScript)"]
    
    subgraph Backend Core (Railway Container)
        Server -->|Auth & RBAC| JWT["🔒 JWT + Fastify Rate Limit"]
        Server -->|ORM Queries| Prisma["💎 Prisma 5 ORM"]
        Server -->|Email Dispatch| Resend["📧 Resend API HTTP Engine"]
        Server -->|WhatsApp Dispatch| WA["💬 Meta Cloud API / HTTP Gateway / wa.me"]
        Server -->|Webhooks & Billing| MP["💳 Mercado Pago API / Subscriptions"]
        Server -->|Push Engine| WebPush["🔔 VAPID Web Push Engine"]
    end
    
    Prisma -->|ACID Transactions| DB[("🐘 PostgreSQL 17 Database")]
    Resend -->|DKIM / SPF Signed| Inbox["📩 Recipient Inbox (@boramarka.com.br)"]
```

---

## 💎 Key Production Innovations & Capabilities

### 📧 High-Reliability Transactional Email Engine (Resend API HTTP)
- **Zero-Block HTTP Architecture**: Migrated from legacy SMTP to Resend's REST API, eliminating cloud container SMTP port blocks (ports 465/587).
- **Custom Domain Authenticated**: Fully verified via DKIM (`resend._domainkey`), SPF (`v=spf1 include:amazonses.com`), and DMARC on `boramarka.com.br`.
- **Automated Workflows**: Instant delivery of 4-digit security verification OTPs, password reset links, and rich onboarding welcome templates.
- **Failover Architecture**: Built-in fallback mechanism ensuring local development transport parity.

### 📲 Tri-Layer WhatsApp Automation Engine
- **Meta Cloud API (Official)**: Native integration using Graph API OAuth tokens and direct Phone Number ID for zero-intermediation automated messaging.
- **Generic HTTP Gateway**: Webhook compatibility with custom WhatsApp gateways (Z-API, Evolution API).
- **Zero-Cost wa.me Smart Fallback**: Dynamic deep-link generator formatted with appointment parameters, unique key `🔑`, and one-click portal access.

### 🐘 Enterprise PostgreSQL 17 & Prisma 5 ORM
- High-concurrency relational data engine enforcing strict ACID transactions, row-level locking, automated migration pipelines, and optimized connection pooling.

### 💬 Real-Time SuperAdmin CRM Support Center
- Direct bidirectional communication channel between store managers and platform administrators.
- High-density Dark Neon UI with live ticket tracking, auto-scroll management, and zero layout shift.

### 🗓️ Client Portal (Reschedule & Cancellation Engine)
- Glassmorphic user interface allowing clients to view, reschedule, or cancel bookings without phone calls.
- Automated enforcement of shop cancellation windows (e.g., minimum 2-hour notice policy) with graceful fallback to shop WhatsApp.

### 🔔 VAPID Web Push Notifications
- Web Push Notifications delivered directly to shop owners' desktop and mobile browsers (Android, iOS Safari, Chrome) upon new appointments.

### 🛡️ LGPD Compliance & Advanced Security
- Official public endpoints for **Terms of Use** (`/termos`) and **Privacy Policy** (`/privacidade`).
- **Role-Based Access Control (RBAC)**: Fine-grained granular permissions for store operators (`canAgendamentos`, `canFinanceiro`, `canRh`, etc.).
- **Rate Limiting**: Protection against brute-force and DoS (120 requests/min per IP via Fastify Rate Limit).
- **Security Headers**: Fastify Helmet enforcement, CORS restriction, and strict input validation via TypeScript schemas.

---

## 🏷️ Subscription Plans & Quotas Matrix

| Resource / Quota | ⚡ **BoraTestar** | 📘 **BoraMensal** | 🔥 **BoraAnual** | 👑 **BoraPremium** |
| :--- | :---: | :---: | :---: | :---: |
| **Pricing** | **Free (7-day trial)** | **R$ 29.90 / month** | **R$ 260.00 / year** *(~R$ 21.66/mo)* | **R$ 79.90 / month** |
| **Monthly Bookings** | 50 (trial) | 500 / month | 2,500 / month | **Unlimited (∞)** |
| **Client Database** | 100 clients | 1,500 clients | 8,000 clients | **Unlimited (∞)** |
| **Staff & Operators** | 2 members | 5 members | 20 members | **Unlimited (∞)** |
| **Services & Public Links** | 10 services / 2 links | 30 services / 10 links | 100 services / 30 links | **Unlimited (∞)** |
| **Mercado Pago Deposit** | ✅ Enabled | ✅ Enabled | ✅ Enabled | ✅ Enabled |
| **Digital Loyalty Card** | — | — | ✅ Enabled | ✅ Enabled |
| **HR & Payroll Module** | — | — | — | 👑 **Exclusive Premium** |

---

## 🏗️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | SPA architecture with Tailwind CSS, Lucide Icons, and responsive design |
| **Backend Runtime** | Fastify v4 + TypeScript | Ultra-fast Node.js framework with strict typings and fast JSON serialization |
| **Database & ORM** | PostgreSQL 17 + Prisma 5 | Enterprise relational database with schema-driven migrations and type safety |
| **Email Infrastructure** | Resend API HTTP | Transactional email delivery with DKIM/SPF domain verification (`boramarka.com.br`) |
| **WhatsApp Integration** | Meta Cloud API + Gateway | Direct API messaging with HTTP webhook fallback |
| **Payment Gateway** | Mercado Pago API v1 | PIX, Credit Card processing, and Preapproval Subscription Webhooks |
| **Push Notifications** | Web Push / VAPID | Native browser notifications for desktop and mobile PWA |
| **Cloud Hosting** | Vercel (FE) + Railway (BE) | Global CDN edge deployment for frontend and containerized backend microservice |

---

## 🔌 API Endpoint Hierarchy

```
/api
├── /auth
│   ├── POST /send-verification-code    # 4-digit OTP email dispatch
│   ├── POST /verify-code               # OTP validation
│   ├── POST /register                  # Multi-tenant admin registration
│   ├── POST /login                     # Admin & Operator authentication
│   ├── POST /forgot-password           # Password reset code dispatch
│   └── POST /reset-password            # Password update
├── /schedule                           # Appointments, calendar, slots
├── /services                           # Catalog management by category
├── /finance                            # Cash flow, transactions, PDF exports
├── /billing                            # Mercado Pago checkout & webhooks
├── /portal                             # Client rescheduling & cancellation
├── /support                            # Live support tickets & CRM chat
├── /loyalty                            # Digital loyalty cards & coupons
└── /superadmin                         # Platform management & metrics
```

---

## 🛠️ Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/thevigillant/boramarka.git
cd boramarka
```

### 2. Configure & Run Backend
```bash
cd backend
npm install

# Setup environment variables in backend/.env
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boramarka"
# RESEND_API_KEY="re_your_api_key"
# RESEND_FROM="BoraMarka <noreply@boramarka.com.br>"

npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```
> Backend API will start at `http://localhost:3001`

### 3. Configure & Run Frontend
```bash
cd ../frontend
npm install
npm run dev
```
> Frontend client will start at `http://localhost:5173`

---

## 📄 License & Intellectual Property

This codebase is proprietary software owned and maintained by **BoraMarka** (Bruno Santana Reis). All rights reserved. Unauthorized copying or redistribution is strictly prohibited.
