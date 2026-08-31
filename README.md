# BoraMarka — Enterprise Multi-Tenant SaaS Platform

<p align="center">
  <img src="https://img.shields.io/badge/System-Production_Ready-00C853?style=for-the-badge&logo=railway&logoColor=white" alt="Status">
  <img src="https://img.shields.io/badge/Domain-boramarka.com.br-000000?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Domain">
  <img src="https://img.shields.io/badge/Frontend-React_18_%7C_Vite_5-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_4_%7C_TypeScript_5-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify">
  <img src="https://img.shields.io/badge/Database-PostgreSQL_17_%7C_Prisma_5-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/PIX_Protocol-Bacen_EMVCo_CRC16-32BCAD?style=for-the-badge&logo=pix&logoColor=white" alt="PIX Protocol">
  <img src="https://img.shields.io/badge/Security-OWASP_Top_10_%7C_LGPD-6D28D9?style=for-the-badge&logo=auth0&logoColor=white" alt="Security">
</p>

---

## 📑 Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. System Architecture & Topology](#2-system-architecture--topology)
- [3. Core Engines & Platform Modules](#3-core-engines--platform-modules)
  - [3.1. BoraEncomenda Engine (v3.0)](#31-boraencomenda-engine-v30)
  - [3.2. Smart Scheduling & Resource Engine](#32-smart-scheduling--resource-engine)
  - [3.3. Bacen EMVCo QRCPS-MPM PIX Engine](#33-bacen-emvco-qrcps-mpm-pix-engine)
  - [3.4. Hyper-Customization & Real-Time Simulator](#34-hyper-customization--real-time-simulator)
  - [3.5. Omnichannel Notification & Integrations Hub](#35-omnichannel-notification--integrations-hub)
- [4. Security Architecture & Threat Mitigation](#4-security-architecture--threat-mitigation)
- [5. Technology Stack](#5-technology-stack)
- [6. Codebase Architecture](#6-codebase-architecture)
- [7. Local Development & Quickstart](#7-local-development--quickstart)
- [8. Configuration & Environment Variables](#8-configuration--environment-variables)
- [9. REST API & Protocol Specification](#9-rest-api--protocol-specification)
- [10. Production Deployment & DevOps](#10-production-deployment--devops)
- [11. Observability, Logging & Reliability](#11-observability-logging--reliability)
- [12. License & Intellectual Property](#12-license--intellectual-property)

---

## 1. Executive Summary

**BoraMarka** is a multi-tenant cloud software-as-a-service platform engineered to power the next generation of autonomous service providers, specialized boutiques, artisan producers, and hybrid retail businesses. 

The platform unifies **online appointment scheduling**, **on-demand product manufacturing/catalog management (BoraEncomenda)**, **native instant PIX payment synthesis**, **Kanban lifecycle automation**, and **custom storefront styling** into a singular, highly resilient operating system.

### Key Value Pillars
- **Zero-Latency Customer Experience**: Micro-optimized mobile storefronts loading in `< 800ms` globally via edge content delivery networks.
- **Bespoke Merchant Personalization**: Real-time styling simulator supporting custom domains (`CNAME`), dynamic themes, color palettes, and interactive validation states.
- **Zero-Intermediary Payments**: Direct client-to-merchant settlements via Bacen EMVCo PIX payload generation with zero gateway take-rates or payout lockups.
- **Automated Operations**: Event-driven WhatsApp, Web Push, and transactional email dispatches triggered across Kanban workflow transitions.

---

## 2. System Architecture & Topology

The platform operates on a decoupled client-server architecture deployed across globally distributed edge nodes and isolated Linux container clusters.

```mermaid
graph TB
    subgraph Client Tier
        Browser["Customer Web Storefront & PWA (:username/loja)"]
        Dashboard["Merchant Executive Dashboard (/dashboard)"]
        SuperAdmin["Platform Operations Portal (/superadmin)"]
    end

    subgraph Edge & Ingress Layer
        VercelCDN["Vercel Global Anycast Edge CDN"]
        SSLTermination["TLS 1.3 Termination & Custom Domain Routing"]
    end

    subgraph API Gateway & Security Policy Layer
        FastifyGateway["Fastify v4 Core Engine (TypeScript 5 + Node.js 20 LTS)"]
        RateLimiter["Adaptive IP / Route Rate Limiting (@fastify/rate-limit)"]
        AuthGuards["JWT Verification & Role-Based Access Control (RBAC)"]
        InputSanitizer["Strict Zod Schema Validation & CSS Injection Neutralizer"]
        AntiTamper["Server-Side Price Re-calculation & Lead-Time Guard"]
    end

    subgraph Domain Engine Services
        BrandingEngine["Branding & Custom Domain Subsystem"]
        BookingEngine["Concurrent Time-Slot & Conflict Resolution Engine"]
        EncomendaEngine["BoraEncomenda Catalog & Order State-Machine"]
        PixEngine["Bacen EMVCo QRCPS-MPM PIX Engine (CRC16-CCITT)"]
        OrderTracker["Real-Time Order Tracking Engine (30s Polling / SSE)"]
        WhatsAppDispatcher["Automated WhatsApp Notification Service (+55 DDI/DDD)"]
        CalendarSync["Google Calendar Two-Way Synchronization Engine"]
        MediaService["Cloudinary WebP/AVIF Asset Optimization Pipeline"]
    end

    subgraph Persistence & Infrastructure Tier
        PrismaORM["Prisma 5 ORM (Connection Pooler)"]
        PostgresDB[("Managed PostgreSQL 17 Cluster (High Availability)")]
        ExternalAPIs["Mercado Pago API | Resend SMTP | Google OAuth2 | WhatsApp Cloud API"]
    end

    Browser & Dashboard & SuperAdmin --> VercelCDN
    VercelCDN --> SSLTermination
    SSLTermination --> FastifyGateway

    FastifyGateway --> RateLimiter
    RateLimiter --> AuthGuards
    AuthGuards --> InputSanitizer
    InputSanitizer --> AntiTamper

    AntiTamper --> BrandingEngine
    AntiTamper --> BookingEngine
    AntiTamper --> EncomendaEngine
    AntiTamper --> PixEngine
    AntiTamper --> OrderTracker
    AntiTamper --> WhatsAppDispatcher
    AntiTamper --> CalendarSync
    AntiTamper --> MediaService

    BrandingEngine & BookingEngine & EncomendaEngine & PixEngine & OrderTracker & WhatsAppDispatcher & CalendarSync & MediaService --> PrismaORM
    PrismaORM --> PostgresDB
    WhatsAppDispatcher & CalendarSync & MediaService --> ExternalAPIs
```

### Production Infrastructure Matrix

| Subsystem | Production Endpoint | Provider / Topology | Target SLA |
| :--- | :--- | :--- | :---: |
| **Web Frontend** | [https://boramarka.com.br](https://boramarka.com.br) | Vercel Edge Global Anycast CDN | 99.99% |
| **Core API Gateway** | [https://api.boramarka.com.br](https://api.boramarka.com.br) | Railway Isolated Linux Node Container | 99.95% |
| **Relational Database** | Managed PostgreSQL 17 Cluster | Railway High-Availability Dedicated Tier | 99.99% |
| **Asset Pipeline** | `res.cloudinary.com/boramarka` | Cloudinary Multi-Region WebP/AVIF CDN | 99.99% |
| **Transactional Mail** | `noreply@boramarka.com.br` | Resend API (DKIM / SPF / DMARC Verified) | 99.90% |
| **Version Control** | [`thevigillant/boramarka`](https://github.com/thevigillant/boramarka) | GitHub Enterprise CI/CD Pipeline | Active |

---

## 3. Core Engines & Platform Modules

### 3.1. BoraEncomenda Engine (v3.0) & Financial Reconciliation
Specialized order-to-production workflow for customized products, artisanal gastronomy, and bespoke commissions:
- **Cinematic Storefront Experience**:
  - Dark Luxury aesthetic with ambient mesh lighting, glassmorphism, and responsive CSS keyframe animations.
  - Automated 6-second rotating widescreen featured showcase (21:9 aspect ratio) with linear progress indicators.
  - Interactive Scheduling HUD verifying merchant lead time (`minAdvanceDays`) dynamically using Brazilian timezone (`America/Sao_Paulo`, UTC-3) before checkout.
  - Client-side persistent Wishlist storing saved items via browser storage with dedicated filter chips.
  - Integrated Bespoke VIP Concierge card directing custom commissions straight to WhatsApp.
- **Automated Financial Reconciliation (`/api/finance/stats`)**:
  - Automatic cash flow reconciliation of paid deposits (*"Entrada de Encomenda"* via PIX or Mercado Pago).
  - Delivery balance scheduled as accounts receivable (*"Restante de Encomenda"*) tied to the promised delivery date (`deliveryDate`).
  - Completed orders (*"ENTREGUE"*) recognized as fulfilled store revenue.
- **Kanban State-Machine**:
  - Structured lifecycle transitions: `RECEBIDO` → `CONFIRMADO` → `EM_PRODUCAO` → `PRONTO` → `ENTREGUE` (or `CANCELADO`).
  - Ultra-smooth drag-to-scroll Kanban view with mouse momentum physics for high-volume order management.
- **Live Real-Time Order Tracking (`/pedido/:orderNumber/rastrear`)**:
  - Dynamic status timeline with stage completion indicators.
  - 30-second background polling cycle updating order state seamlessly without full page refreshes.
  - PII masking enforcing LGPD compliance for public tracking URLs.

### 3.2. Smart Scheduling & Resource Engine
- **Collision-Free Slot Calculation**:
  - Real-time computing incorporating operator schedules, lunch breaks, individual buffer times, and operating windows.
  - Multi-service checkout allowing combined procedures in consecutive or bundled time blocks.
- **Google Calendar Two-Way Synchronization**:
  - OAuth2 token management with automated token refresh.
  - Prevents calendar double-booking by reconciling external Google Calendar events with BoraMarka slots.

### 3.3. Bacen EMVCo QRCPS-MPM PIX Engine
- **Dynamic Payload Synthesis**:
  - Native implementation of the official Central Bank of Brazil (BACEN) EMVCo QRCPS-MPM specification.
  - Dynamic CRC16-CCITT polynomial checksum calculation guaranteeing universal bank interoperability (Nubank, Itaú, Bradesco, Santander, Inter, etc.).
- **Zero Merchant Credential Friction**:
  - Operates using simple merchant PIX keys (CPF/CNPJ, E-mail, Phone, Random EVP).
  - Automatically provisions exact deposit amounts (`depositAmount` or full settlement) and merchant metadata without requiring banking developer credentials.
  - Proactive key auto-repair cross-synchronized between admin profile and storefront checkout.

### 3.4. Hyper-Customization & Real-Time Simulator
- **Reactive Mobile Device Simulator**:
  - 310px viewport simulator mirroring customer mobile views in real time as settings and operational modes are toggled.
  - Real-time adaptive catalog preview reflecting **Services Only**, **On-Demand Products Only (BoraEncomenda)**, or **Hybrid Mode**.
- **Visual Identity Management**:
  - Dynamic color palette generator (Primary/Secondary accents, presets, and light/dark theme toggle).
  - High-resolution Avatar and Banner upload with client-side canvas aspect ratio auto-cropping (1200x400).
- **Interactive State Feedback**:
  - Asynchronous form submission with animated button states (`Saving...`, `Success ✓`), banner alerts, and global floating toast notifications.

### 3.5. Mobile Experience & Native Safe-Area Posture
- **Hardware Safe-Area Insets**:
  - Toast and notification widgets leverage `env(safe-area-inset-top)` for full compatibility with iPhone Dynamic Island, top notches, and Android system status bars.
- **Virtual Keyboard Viewport Containment**:
  - Modals across the platform incorporate `max-h-[90vh]` and bounded `overflow-y-auto` rules to prevent buttons or inputs from being pushed off-screen when software keyboards expand on mobile devices.

### 3.6. Omnichannel Notification & Integrations Hub
- **Dynamic Multi-Environment Routing**:
  - Automatic resolution of frontend URLs across local development (`localhost:5173`), custom domains (`CNAME`), and production edge deployments.
- **WhatsApp Notification Pipeline**:
  - Automatic dispatch of structured message templates across order lifecycle milestones.
  - Phone normalization with Brazilian standard (+55 DDI, 2-digit DDD, 9-digit mobile sanitization).
- **Web Push Notifications**:
  - VAPID key protocol implementation for direct browser push notifications even when tabs are inactive.

---

## 4. Security Architecture & Threat Mitigation

BoraMarka enforces an OWASP Top 10 aligned defense-in-depth posture:

| Threat Vector | Mitigation Strategy | Implementation Detail |
| :--- | :--- | :--- |
| **CSS / DOM Injection** | Regular expression color sanitizer | Rejects malicious style strings; enforces strict `#RGB`, `#RRGGBB`, and bounded functional color expressions. |
| **Cart Price Tampering** | Server-side pricing recalculation | Ignores client-provided subtotals; queries database product records inside transactional boundary. |
| **Lead-Time Violation** | Server-side calendar delta check | Verifies `diffDaysBrazilian(deliveryDate, today) >= minAdvanceDays` before persisting order entity. |
| **Timezone Drift (UTC/BRT)**| Brazilian Timezone (`America/Sao_Paulo`) normalization | Dedicated date calculation engine preventing early-day cutoff anomalies between 21:00 and 00:00 BRT. |
| **Database Query Contention**| Multi-column PostgreSQL relational indexing | Indexed lookups on `adminId`, foreign keys, and filter states across `Order`, `Product`, `Booking`, `Transaction`, and `TimeSlot`. |
| **Credential Leakage** | API response payload filtering | Completely strips sensitive tokens (`mpAccessToken`) and private keys from public storefront payloads. |
| **PII Scraping / Enumeration** | Deterministic token authorization & PII masking | Masks customer names, phones, emails, and street addresses unless accessed with 16-character cancellation/security token. |
| **DoS / Brute Force** | Per-route tiered rate limiting | 10 requests/minute on order creation (`POST /api/store/:username/order`); 30 requests/minute on tracking lookup. |
| **Privilege Escalation** | Multi-tier RBAC | Strict separation between `superadmin`, `merchant` (admin), and `collaborator` roles. |

---

## 5. Technology Stack

```
Frontend Ecosystem
├── Core: React 18.2, TypeScript 5.3, Vite 5.4
├── Styling: Tailwind CSS 3.3, Custom Keyframe Animations, Glassmorphism
├── Routing: React Router DOM 6.20
├── Icons: Lucide React 0.294
├── Printing/Export: jsPDF 4.2, jsPDF-AutoTable 5.0
└── QR Engine: qrcode 1.5, Bacen EMVCo CRC16

Backend Ecosystem
├── Runtime: Node.js 20 LTS (Active LTS)
├── Framework: Fastify 4.25 (High-Throughput async pipeline)
├── ORM & DB: Prisma 5.7, PostgreSQL 17
├── Security: @fastify/helmet, @fastify/cors, @fastify/rate-limit, @fastify/jwt, bcryptjs
├── Validation: Zod 4.4 runtime schema parsing
├── Multi-part: @fastify/multipart (Buffered streaming upload)
└── External: Mercado Pago SDK 3.1, Cloudinary SDK 2.10, Resend 6.18, Web-Push 3.6
```

---

## 6. Codebase Architecture

```
boramarka/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL relational schema & relations
│   │   └── seed.ts                # Initial development & test dataset
│   ├── src/
│   │   ├── routes/                # Domain-driven Fastify API route controllers
│   │   │   ├── admin.ts           # Merchant settings, branding & profile routes
│   │   │   ├── auth.ts            # Authentication, registration & password resets
│   │   │   ├── billing.ts         # Subscription & checkout management
│   │   │   ├── employees.ts       # Team, permissions & payroll subsystem
│   │   │   ├── finance.ts         # Cash flow, receivables & expense tracking
│   │   │   ├── googleCalendar.ts  # Google OAuth2 calendar sync controller
│   │   │   ├── orderSettings.ts   # BoraEncomenda operating rules
│   │   │   ├── orders.ts          # Order state-machine & Kanban management
│   │   │   ├── products.ts        # Product catalog & category management
│   │   │   ├── schedule.ts        # Booking slots, appointments & availability
│   │   │   ├── storefront.ts      # Public customer storefront API
│   │   │   └── upload.ts          # Cloudinary asset processing pipeline
│   │   ├── scripts/               # Backup & operational automation tools
│   │   └── server.ts              # Fastify application bootstrap & middleware
│   ├── Dockerfile                 # Multi-stage production container definition
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Reusable UI component library
│   │   │   ├── dashboard/         # Merchant administration tabs & modals
│   │   │   │   ├── tabs/
│   │   │   │   │   ├── BoraEncomendaTab.tsx
│   │   │   │   │   ├── PersonalizarTab.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── Toast.tsx      # Enterprise floating notification widget
│   │   │   └── storefront/        # Public customer-facing storefront modules
│   │   ├── pages/                 # Route entrypoints (Storefront, Dashboard, Tracking)
│   │   ├── services/              # Strongly-typed HTTP API client abstraction
│   │   └── index.css              # Design tokens, custom scrollbars, animations
│   ├── vite.config.ts             # Vite build orchestration & dev server config
│   └── package.json
│
├── docker-compose.yml             # Full-stack local development container setup
└── README.md                      # Platform engineering documentation
```

---

## 7. Local Development & Quickstart

### Prerequisites
- **Node.js**: `>= 20.0.0 LTS`
- **PostgreSQL**: `>= 15.0` (or Docker)
- **Package Manager**: `npm >= 9.0.0`

### Step 1: Clone Repository
```bash
git clone https://github.com/thevigillant/boramarka.git
cd boramarka
```

### Step 2: Database Provisioning (Docker Alternative)
If you do not have a local PostgreSQL instance running:
```bash
docker-compose up -d postgres
```

### Step 3: Backend Setup
```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Execute database migrations & generate Prisma client
npx prisma migrate dev
npx prisma db seed

# Launch backend development server (Port 3001)
npm run dev
```

### Step 4: Frontend Setup
```bash
cd ../frontend
npm install

# Launch frontend development server (Port 5173)
npm run dev
```

The application will be accessible at:
- **Merchant Web Dashboard**: `http://localhost:5173/dashboard`
- **Storefront Simulator**: `http://localhost:5173/p/:username`
- **Core API Gateway**: `http://localhost:3001`

---

## 8. Configuration & Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Type | Description | Default / Example |
| :--- | :---: | :--- | :--- |
| `PORT` | Number | Port for Fastify HTTP server | `3001` |
| `DATABASE_URL` | String | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/boramarka` |
| `JWT_SECRET` | String | Secret key for signing authentication tokens | `super-secret-production-key` |
| `SUPERADMIN_PASSWORD`| String | Password for platform master access | `300923` |
| `MERCADOPAGO_ACCESS_TOKEN` | String | Mercado Pago API Access Token | `APP_USR-...` |
| `MERCADOPAGO_PUBLIC_KEY` | String | Mercado Pago Public Key | `APP_USR-...` |
| `GOOGLE_CLIENT_ID` | String | Google OAuth2 Client ID for Calendar sync | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | String | Google OAuth2 Client Secret | `GOCSPX-...` |
| `SMTP_HOST` | String | Outgoing SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Number | Outgoing SMTP port | `587` |
| `SMTP_USER` | String | SMTP authenticated user | `contatoboramarka@gmail.com` |
| `SMTP_PASS` | String | SMTP application password | `**** **** **** ****` |
| `CLOUDINARY_CLOUD_NAME`| String | Cloudinary storage bucket / cloud identifier| `m8dpiwco` |
| `CLOUDINARY_API_KEY` | String | Cloudinary API Key | `829597426453796` |
| `CLOUDINARY_API_SECRET`| String | Cloudinary API Secret | `7EfcS4z1zx8b8uhssVVolKLzl6A` |
| `VAPID_PUBLIC_KEY` | String | Web Push notification public key | `BIADc...` |
| `VAPID_PRIVATE_KEY` | String | Web Push notification private key | `c55694...` |

---

## 9. REST API & Protocol Specification

### Authentication & Profiles (`/api/auth`, `/api/admin`)
- `POST /api/auth/login`: Issue JSON Web Token for merchant sessions.
- `POST /api/auth/register`: Onboard new merchant with automated subdomain provisioning.
- `GET /api/admin/profile`: Retrieve merchant settings, subscription tier, and visual identity.
- `PUT /api/admin/profile`: Update business name, bio, brand colors, custom domain, and operational mode.

### Storefront & Consumer Operations (`/api/store`)
- `GET /api/store/:username`: Public store payload (catalog, theme tokens, availability metadata).
- `POST /api/store/:username/order`: Atomically create an on-demand order with server-verified pricing.
- `GET /api/store/order/:orderNumber/track`: Retrieve sanitized order status timeline.

### Scheduling & Calendar Engine (`/api/schedule`)
- `GET /api/schedule/slots`: Compute available booking slots for selected date range and services.
- `POST /api/schedule/book`: Persist appointment reservation and trigger calendar sync.

### Financial Management (`/api/finance`)
- `GET /api/finance/stats`: Consolidated revenue, receivables, expenses, and net profit calculations.
- `GET /api/finance/transactions`: Filterable ledger entries with category grouping and date filtering.

---

## 10. Production Deployment & DevOps

### Containerized Deployment (Docker)

```bash
# Build multi-stage optimized image
docker build -t boramarka-backend:latest ./backend

# Run production container
docker run -d \
  -p 3001:3001 \
  --env-file ./backend/.env \
  --name boramarka-backend-prod \
  boramarka-backend:latest
```

### Production Build Validation
```bash
# Verify backend type safety & compilation
cd backend && npm run build

# Verify frontend bundle tree-shaking & asset minification
cd ../frontend && npm run build
```

---

## 11. Observability, Logging & Reliability

- **High-Performance Structured Logging**: Uses `pino-pretty` in development and structured JSON output in production for ingest by Datadog, Grafana Loki, or Railway Log Streams.
- **Graceful Shutdown Handlers**: Fastify traps `SIGTERM` and `SIGINT` to gracefully drain inflight HTTP connections and terminate Prisma connection pools cleanly without dropped requests.
- **Healthcheck Probes**: Health probes available on `/` returning system health status and uptime metrics for container orchestrators.

---

## 12. License & Intellectual Property

Proprietary Software. All rights reserved.  
**BoraMarka Platform** — Designed & Engineered by Bruno Santana Reis (2026).
