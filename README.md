# 🚀 BoraMarka — Enterprise SaaS Platform for Automated Scheduling & Custom Product Orders

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production_Ready-emerald?style=for-the-badge&logo=railway" alt="Status">
  <img src="https://img.shields.io/badge/Domain-boramarka.com.br-000000?style=for-the-badge&logo=googlechrome" alt="Domain">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_v4_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Validation-Zod_v3-3068B7?style=for-the-badge&logo=zod" alt="Zod">
  <img src="https://img.shields.io/badge/Database-PostgreSQL_17_%2B_Prisma_5-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/BoraEncomenda-Custom_Orders_%2B_Kanban-EC4899?style=for-the-badge&logo=shopify" alt="BoraEncomenda">
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

**BoraMarka** is an enterprise-grade multi-tenant SaaS platform built both for **service professionals** (barbershops, beauty salons, health clinics, tattoo studios, pet centers) and **custom-order makers & confectioneries** (cakes, sweets, chocolates, buffets, artisanal products).

It unifies online scheduling, digital storefronts, custom order workflows, production Kanban tracking, automatic WhatsApp reminders, Mercado Pago Pix deposit splits, revenue BI, and workforce HR management.

```mermaid
graph TD
    Client["📱 Client & Admin Web Apps (React 18 + Vite)"] -->|HTTPS / REST API| Edge["🛡️ Vercel Edge / CDN"]
    Edge -->|DNS / Reverse Proxy| Server["⚡ Fastify Backend (TypeScript)"]
    
    subgraph Security & Validation Layer
        Server -->|Input Sanitization| Zod["🛡️ Zod Runtime Schema Validation"]
        Server -->|Authentication & RBAC| JWT["🔒 JWT + Fastify Rate Limit + Helmet"]
    end

    subgraph Service & Engine Layer
        Zod --> Encomenda["🎂 BoraEncomenda Engine & Production Kanban"]
        Zod --> Scheduling["📅 Smart Slot Scheduling & Deposit Engine"]
        Zod --> Upload["📸 Cloudinary High-Res Media Pipeline"]
        Zod --> Bot["🤖 Helpdesk AI Auto-Responder & SLA Engine"]
        Zod --> Reviews["⭐ Verified Social Proof Reviews Engine"]
        Zod --> WA["💬 Multi-Channel WhatsApp Reminder Engine"]
        Zod --> MP["💳 Mercado Pago Split & Subscriptions"]
        Zod --> Email["📧 Resend HTTP Transactional Mailer"]
    end
    
    subgraph Data Persistence Layer
        Encomenda & Scheduling & Upload & Bot & Reviews & WA & MP & Email --> Prisma["💎 Prisma 5 ORM"]
        Prisma -->|ACID Transactions & Connection Pooling| DB[("🐘 PostgreSQL 17 Database")]
    end
```

---

## 💎 Core Capabilities & Engineering Highlights

### 🎂 Módulo Revolucionário BoraEncomenda (v2.4)
- **Digital Showcase (`/loja/:username`)**: High-converting digital catalog for confectioneries, artisan bakeries, and gourmet makers.
- **Deep Customization Options**: Dynamic questions per item (cake dough, fillings, gourmet toppers, custom dedication cards).
- **Minimum Production Lead Time**: Automated scheduling respecting minimum days of preparation, batch size caps, and operating windows.
- **Online Pix Deposit Split**: Configurable upfront deposit (e.g., 50%) via Mercado Pago with remaining balance on delivery/pickup.
- **5-Stage Production Kanban**: Real-time kitchen workflow (`RECEIVED` ➔ `IN_PRODUCTION` ➔ `READY` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`).
- **Live Order Tracking (`/rastreio/:code`)**: Public real-time tracking link with timeline, status badges, and receipt download.

### 📸 High-Resolution Visual Experience (v2.3)
- **Drag-and-Drop Image Uploader**: Integrated image pipeline with client-side canvas compression and Cloudinary hosting.
- **Hero Showcase on Booking Pages**: Top visual hero displaying service image, duration badge, and rich markdown description.
- **Upsell Combos with Photos**: Visual merchandising of add-ons directly during checkout.

### 🏛️ Intelligent Business Scope Segregation (v2.2)
- **`SERVICES` (Time-Slot Scheduling)**: Streamlined interface for solo barbers, manicures, and clinicians focusing on time slots.
- **`PRODUCTS` (Custom Orders)**: Tailored interface for confectioners, bakeries, and crafters prioritizing the BoraEncomenda catalog and production Kanban.
- **`HYBRID` (Dual Operation)**: Complete dual capability with segregated `Service` and `Product` database entities.

### 🔔 Real-Time Changelog Modal & Navbar
- **Updates Notification Center**: Interactive Changelog modal explaining major releases, security audits, and new features.
- **Streamlined Minimalist Navbar**: High-converting pill island with frosted glass aesthetics (`backdrop-blur-2xl`).

### 🤖 Intelligent Helpdesk & Business Assistant (BoraIA)
- **Context-Aware Assistance**: Instant generation of promotional copy, schedule optimization advice, and WhatsApp reminders.
- **SLA & Support Engine**: 24h/48h SLA tracking, automated intent classification, and CSAT 5-star feedback rating.

---

## 🏷️ Subscription Plans & Feature Matrix

| Feature / Resource | 📘 **Essencial** | 🔥 **Profissional (Mais Escolhido)** | 👑 **Studio VIP** |
| :--- | :---: | :---: | :---: |
| **Monthly Pricing** | **R$ 29.90 / mo** | **R$ 49.90 / mo** | **R$ 79.90 / mo** |
| **Annual Pricing** | **R$ 199.90 / yr** *(R$ 16.65/mo)* | **R$ 399.90 / yr** *(R$ 33.32/mo)* | **R$ 699.90 / yr** *(R$ 58.32/mo)* |
| **Target Audience** | Solo Professionals & Makers | Growing Salons & Confectioneries | Clinics, Large Studios & Franchises |
| **Team Members** | 1 Professional / Attendant | Up to 5 Professionals | **Unlimited (∞)** |
| **Monthly Volume** | Up to 500 bookings or orders | Up to 3,000 bookings or orders | **Unlimited (∞)** |
| **BoraEncomenda Showcase & Kanban** | Basic Link | ✅ **Full Module with Kanban** | ✅ **Unlimited Products & Orders** |
| **Visual Upsell Combos** | — | ✅ **Enabled with Photos** | ✅ **Enabled** |
| **Digital Loyalty & Coupons** | — | ✅ **Enabled** | ✅ **Enabled** |
| **BoraIA Business Assistant** | — | ✅ **Integrated** | ✅ **Integrated** |
| **Employee HR & Geo-Clock In** | — | — | 👑 **Exclusive** |
| **Whitelabel & Custom Domain** | — | — | 👑 **Exclusive** |
| **Granular RBAC Access Control** | — | — | 👑 **Exclusive** |

---

## 🏗️ Technology Stack

| Layer | Technology | Key Specifications |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, Vite 5, Tailwind CSS | SPA architecture, Lucide Icons, Glassmorphism, Theme Engine |
| **Backend API** | Fastify v4, TypeScript 5, Node.js | Low-overhead routing, Schema serialization, JWT, Rate Limiter, Helmet |
| **Validation** | Zod v3 | Runtime payload validation, Type inference, Sanitization |
| **Database & ORM** | PostgreSQL 17, Prisma 5 | High-concurrency ACID transactions, Schema migrations, Connection pooling |
| **Unit Testing** | Vitest | Sub-second test execution, Schema coverage, Mock assertions |
| **Media Pipeline** | Cloudinary REST API | High-res image storage, auto-scaling and format optimization |
| **Email Infrastructure** | Resend API HTTP | Transactional DKIM/SPF authenticated email delivery (`boramarka.com.br`) |
| **Payment Gateway** | Mercado Pago SDK | PIX, Credit Card tokenization, Preapproval Webhooks |
| **Deployment & CI/CD** | Vercel (FE) + Railway (BE) | Global CDN edge network and containerized microservice deployments |

---

## 🔌 API Endpoint Directory

```
/api (and /api/v1)
├── /auth
│   ├── POST /send-verification-code    # 4-digit OTP email dispatch (with devCode in localhost)
│   ├── POST /verify-code               # OTP validation
│   ├── POST /register                  # Multi-tenant admin registration (supports businessType)
│   ├── POST /login                     # Admin & Operator JWT authentication
│   ├── POST /forgot-password           # Password reset code dispatch
│   └── POST /reset-password            # Password update
├── /products                           # Custom-order product catalog & categories
│   ├── GET    /                        # List store products & customization questions
│   ├── POST   /                        # Create product with lead time, photos & options
│   ├── PUT    /:id                     # Update product details
│   └── DELETE /:id                     # Remove product
├── /orders                             # BoraEncomenda production management
│   ├── GET    /                        # Store orders with status filters
│   ├── GET    /stats                   # Order KPIs, revenue & pending counts
│   ├── PATCH  /:id/status              # Kanban stage transition (RECEIVED -> DELIVERED)
│   └── POST   /                        # Create manual order
├── /storefront                         # Public order store
│   ├── GET    /:username               # Public store profile, products & order settings
│   ├── POST   /:username/order         # Place public custom order with Pix deposit
│   └── GET    /tracking/:trackingCode  # Public real-time order status tracking
├── /upload                             # Image upload pipeline (Cloudinary)
├── /schedule
│   ├── GET    /p/:username             # Public profile with review stats
│   ├── GET    /by-host                 # Subdomain/Custom domain profile lookup
│   ├── POST   /bookings                # Public appointment reservation
│   └── GET    /admin/bookings          # Authenticated store bookings
├── /reviews
│   ├── GET    /public/:adminId         # Public approved reviews & rating average
│   ├── POST   /submit                  # Verified post-booking review submission
│   └── PATCH  /:id/moderate            # Review moderation toggle
├── /services
│   ├── GET    /                        # Service catalog with photo URLs & upsells
│   ├── POST   /                        # Zod-validated service creation
│   └── PUT    /:id                     # Service modification
├── /finance
│   ├── GET    /stats                   # Real-time cash flow & metrics
│   ├── GET    /transactions            # Filtered financial ledger
│   └── POST   /transactions            # Zod-validated transaction creation
├── /support                            # Tickets with AI auto-reply & CSAT
├── /analytics                          # Monthly revenue, weekday heatmap, top services
├── /admin/employees                    # Staff management, payroll & portal links
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
# CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

npx prisma generate
npx prisma db push
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

Copyright © 2026 BoraMarka S.A. All rights reserved.
Proprietary enterprise SaaS platform developed with BigTech standards.
