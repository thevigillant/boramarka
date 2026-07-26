# 🚀 BoraMarka — Plataforma SaaS de Agendamento Online & Gestão Inteligente

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em_Produção-emerald?style=for-the-badge&logo=vercel" alt="Status">
  <img src="https://img.shields.io/badge/PWA-Instalável_Android%2FiOS-ec4899?style=for-the-badge&logo=pwa" alt="PWA">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_v4_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Database-Prisma_5_%2B_PostgreSQL-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Gateway-Mercado_Pago_API_v1-009EE3?style=for-the-badge&logo=mercadopago" alt="Mercado Pago">
  <img src="https://img.shields.io/badge/Segurança-Helmet_%2B_Rate_Limit-violet?style=for-the-badge&logo=shield" alt="Security">
</p>

---

## 🌐 Endereços Oficiais em Produção

* 🌐 **Plataforma Web (Domínio Próprio):** [https://boramarka.com.br](https://boramarka.com.br) | [https://www.boramarka.com.br](https://www.boramarka.com.br)
* ⚡ **API Backend (Railway Cluster):** [https://api.boramarka.com.br](https://api.boramarka.com.br)
* 📦 **Repositório GitHub:** [`thevigillant/boramarka`](https://github.com/thevigillant/boramarka)

---

## 💡 Sobre o BoraMarka

O **BoraMarka** é uma plataforma SaaS (*Software as a Service*) de alta performance projetada para revolucionar a rotina de profissionais autônomos e estabelecimentos comerciais que atendem com hora marcada. 

A plataforma reúne em um único ecossistema: **Agendamento Online 24/7**, **Cobrança de Sinal Antecipado via Mercado Pago**, **Cartão Fidelidade Digital**, **Onboarding Inteligente por Nicho**, **Venda Casada (Upsell)**, **Notificações Automáticas via WhatsApp & Web Push**, **Fluxo de Caixa com Exportação em PDF/Excel** e **Gestão de Equipe & RH**.

### 🎯 Para quem foi feito:
- 💈 **Barbearias** & Barbadeiros
- 💅 **Salões de Beleza, Manicures & Esmalterias**
- ✒️ **Estúdios de Tatuagem & Piercing**
- 🧴 **Clínicas de Estética, Lash Designers & Sobrancelhas**
- 🏋️ **Personal Trainers, Fisioterapeutas & Profissionais de Saúde**
- 🐾 **Pet Shops & Serviços de Banho e Tosa**
- 🩺 **Consultórios & Clínicas Médicas**

---

## 💎 Destaques & Funcionalidades Principais

### 🚀 Onboarding Personalizado por Nicho (Auto-Seeding)
- Ao se cadastrar, o profissional escolhe o seu nicho de atuação (Barbearia, Salão, Tatuagem, Estética, Personal, Pet Shop, Clínicas).
- O sistema popula automaticamente o catálogo inicial com **3 serviços de alta conversão** customizados com nomes, preços e durações recomendados para o seu setor.

### 📱 PWA Nativo (App Instalável no Celular)
- Suporte completo a Progressive Web App via `manifest.json`.
- Permite a instalação nativa do BoraMarka na tela inicial em dispositivos Android, iOS (Safari) e Desktops.
- Banner flutuante inteligente (`PWAInstallBanner.tsx`) com instruções de 2 passos guiadas para usuários de iPhone/iPad.

### 🎁 Cartão Fidelidade Digital & Cupons Automáticos
- Contabilização automática de selos (`LoyaltyCard`) a cada atendimento concluído pelo profissional.
- Meta de selos customizável (ex: 10 atendimentos) com geração automática de cupons promocionais únicos (`FIDELIDADE-XXXXXX`).
- Widget público interativo (`LoyaltyWidget.tsx`) para o cliente consultar sua cartela e resgatar recompensas informando seu WhatsApp.

### 💳 Cobrança de Sinal Antecipado & Checkout Mercado Pago
- **Redução de No-Shows a Zero**: Clientes pagam taxa de sinal ou o valor integral via PIX / Cartão no agendamento. O valor é creditado direto no Mercado Pago do profissional.
- **Central de Estornos Automatizados**: Permite ao profissional realizar reembolso direto no Mercado Pago via 1-click no painel administrativo, registrando o estorno no fluxo de caixa e notificando o cliente pelo WhatsApp.

### 🏷️ Estrutura de Planos 3-Tier (Good-Better-Best)
1. **⚡ BoraTestar**: 7 dias de acesso grátis completo sem necessidade de cartão de crédito.
2. **📘 BoraMensal (R$ 29,90/mês)**: Ideal para começar (agenda 24h, sinal Mercado Pago, WhatsApp, até 5 serviços ativos).
3. **🔥 BoraAnual (R$ 260,00/ano ~ R$ 21,66/mês)**: **O Mais Vendido**. Serviços e links ilimitados, Venda Casada (Upsell), Cartão Fidelidade e exportação em Excel/PDF.
4. **👑 BoraPremium (R$ 69,90/mês)**: Gestão de Equipe/RH, Notificações Web Push, Sincronização Google Calendar, Domínio Próprio e Remoção Total da marca BoraMarka (Whitelabel).

### 🛍️ Venda Casada (Upsell) & Serviços Adicionais
- Associação de serviços secundários (com desconto percentual configurável) a serviços principais.
- Recálculo automático do valor total e tempo de atendimento no agendamento do cliente.

### 📄 Exportação de Dados Financeiros e de Agendamentos
- **Relatórios em PDF**: Relatórios estruturados de fluxo de caixa e agendamentos com logomarca e período customizável.
- **Planilhas CSV (UTF-8 BOM)**: Exportação compatível com Microsoft Excel sem problemas de acentuação ou caracteres especiais.

### 🔒 Segurança Defensiva & Audit Logs
- Proteção contra vulnerabilidades com **Fastify Helmet** (HTTP Headers de segurança) e **Rate Limiting** (120 req/min por IP).
- Auditoria de acessos (`AuditLog`) rastreando IP de origem, Navegador, Sistema Operacional e Nível de Risco.

### 🗓️ Integração Bidirecional com Google Calendar
- Sincronização automática dos compromissos da plataforma com a agenda pessoal do profissional no Google, bloqueando horários concorrentes.

---

## 🏗️ Arquitetura e Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Single Page Application com Tailwind CSS, Lucide Icons e UI fluida |
| **Backend** | Fastify v4 + TypeScript | Servidor RESTful otimizado de alta velocidade |
| **ORM** | Prisma ORM 5.x | Modelagem e migrations com suporte a SQLite (Dev) e PostgreSQL (Prod) |
| **Banco de Dados** | SQLite / PostgreSQL | Banco de dados relacional com relatórios otimizados |
| **Gateway de Pagamento** | Mercado Pago API v1 | Processamento de cobranças PIX, Cartão e Refunds |
| **E-mail Transacional** | Nodemailer (Gmail SSL 465) | Envio resiliente de códigos de verificação de 4 dígitos com fallback inteligente |
| **Notificações** | Web Push (VAPID) | Notificações nativas no navegador/dispositivo |

---

## 🛠️ Como Executar o Projeto Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/thevigillant/boramarka.git
cd boramarka
```

### 2. Configurar o Backend
```bash
cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev
```
> O servidor backend iniciará em `http://localhost:3001`

### 3. Configurar o Frontend
```bash
cd ../frontend
npm install
npm run dev
```
> A aplicação frontend iniciará em `http://localhost:5173`

---

## ⚙️ Variáveis de Ambiente (`.env`)

Exemplo de configuração para o `backend/.env`:

```env
PORT=3001
JWT_SECRET=sua-chave-secreta-jwt-aqui
DATABASE_URL="file:./dev.db"

# Mercado Pago API
MERCADOPAGO_ACCESS_TOKEN=seu_access_token
MERCADOPAGO_PUBLIC_KEY=sua_public_key

# E-mail Transacional (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=contatoboramarka@gmail.com
SMTP_PASS=sua_senha_de_app_do_gmail
SMTP_FROM="BoraMarka <contatoboramarka@gmail.com>"
```

---

## 📄 Licença

Este projeto é um software proprietário mantido por **BoraMarka** (Bruno Santana Reis). Todos os direitos reservados.
