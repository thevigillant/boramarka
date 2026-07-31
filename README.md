# 🚀 BoraMarka — Plataforma SaaS de Agendamento Online & Gestão Inteligente

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em_Produção-emerald?style=for-the-badge&logo=vercel" alt="Status">
  <img src="https://img.shields.io/badge/PWA-Instalável_Android%2FiOS-ec4899?style=for-the-badge&logo=pwa" alt="PWA">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_v4_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Database-Prisma_5_%2B_PostgreSQL_17-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/WhatsApp-Meta_Cloud_API_%2B_Fallback-25D366?style=for-the-badge&logo=whatsapp" alt="WhatsApp">
  <img src="https://img.shields.io/badge/Gateway-Mercado_Pago_API_v1-009EE3?style=for-the-badge&logo=mercadopago" alt="Mercado Pago">
  <img src="https://img.shields.io/badge/Segurança-RBAC_Avançado-violet?style=for-the-badge&logo=shield" alt="Security">
</p>

---

## 🌐 Endereços Oficiais em Produção

* 🌐 **Plataforma Web (Domínio Próprio):** [https://boramarka.com.br](https://boramarka.com.br) | [https://www.boramarka.com.br](https://www.boramarka.com.br)
* ⚡ **API Backend:** [https://api.boramarka.com.br](https://api.boramarka.com.br)
* 📦 **Repositório GitHub:** [`thevigillant/boramarka`](https://github.com/thevigillant/boramarka)

---

## 💡 Sobre o BoraMarka

O **BoraMarka** é uma plataforma SaaS (*Software as a Service*) de alta performance projetada para revolucionar a rotina de profissionais autônomos, estúdios, clínicas e estabelecimentos comerciais que atendem com hora marcada.

A plataforma reúne em um único ecossistema: **Agendamento Online 24/7**, **Integração WhatsApp Multicanal (Meta Cloud API, Gateway HTTP e Fallback wa.me Custo Zero)**, **Central de Suporte & Chat em Tempo Real com o SuperAdmin**, **Notificações Web Push em Tempo Real para o Gestor**, **Conformidade Total LGPD (Termos de Uso & Política de Privacidade)**, **Recorrência Automática Mercado Pago (Subscriptions/Preapproval)**, **Cobrança de Sinal Antecipado via Mercado Pago**, **Portal de Remarcação & Cancelamento para Clientes com Validação de Política**, **Login de Colaboradores por Empresa**, **Módulo de RH & Equipe**, **Cartão Fidelidade Digital & Cupons**, **Onboarding Inteligente por Nicho**, **Gerador de Bio do Instagram**, **Fluxo de Caixa com Exportação em PDF/Excel** e **SEO & Open Graph Otimizado**.

---

## 💎 Destaques & Novas Funcionalidades de Produção

### 📲 Integração WhatsApp Tripla (Meta Cloud API, Gateways & Fallback)
- **Meta Cloud API Oficial**: Suporte a envio direto de mensagens e comprovantes sem intermediações usando Token oficial e Phone ID.
- **Gateway HTTP Genérico**: Compatibilidade nativa com APIs como Z-API, Evolution API ou gateways próprios via webhook HTTP.
- **Fallback wa.me 100% Gratuito**: Botão direto de compartilhamento com texto formatado contendo detalhes do agendamento, código único de gerenciamento `🔑` e link direto para alteração ou cancelamento.

### 🐘 Migração para Banco de Dados PostgreSQL 17
- Migração completa do ORM Prisma para **PostgreSQL 17**, oferecendo alta disponibilidade, transações ACID rigorosas e suporte robusto para milhares de acessos concorrentes.

### 💬 Central de Suporte & Chat em Tempo Real no SuperAdmin
- Canal direto de chamados entre o profissional/gestor e a equipe SuperAdmin.
- Layout de alta densidade responsivo com visualização de tíquetes, atualização em tempo real e cálculo dinâmico de altura sem rolagem indesejada.

### 🗓️ Portal de Gerenciamento de Agendamento do Cliente (Cancelamento / Remarcação)
- Interface Glassmorphism de alta visibilidade e contraste nítido em tema dark neon.
- Validação automática da política de prazo mínimo para cancelamentos online (ex: até 2 horas antes) com redirecionamento inteligente ao WhatsApp do profissional em casos de exceção.

### 🔔 Web Push Notifications para o Gestor
- Envio de notificações push nativas no navegador e celular (Android, iOS, Chrome, Safari) para o profissional no momento em que um cliente realiza um novo agendamento.
- Chaves VAPID oficiais configuradas e alternador no cabeçalho do painel.

### 🛡️ Conformidade LGPD (Lei Geral de Proteção de Dados)
- Rotas públicas oficiais de **Termos de Uso** (`/termos`) e **Política de Privacidade** (`/privacidade`).
- Consentimento transparente no fluxo de cadastro e agendamento.

### 🔄 Assinaturas Recorrentes Automáticas (Mercado Pago Preapproval)
- Renovação automática mensal e anual dos planos da plataforma diretamente via Mercado Pago Subscriptions com suporte a webhooks.

---

## 🏷️ Matriz Oficial de Planos & Cotas

| Recurso / Cota | ⚡ **BoraTestar** | 📘 **BoraMensal** | 🔥 **BoraAnual** | 👑 **BoraPremium** |
| :--- | :---: | :---: | :---: | :---: |
| **Preço** | **Grátis (7 dias)** | **R$ 29,90/mês** | **R$ 260,00/ano** *(~R$ 21,66/mês)* | **R$ 79,90/mês** |
| **Agendamentos / mês** | 50 (teste) | 500 /mês | 2.500 /mês | **Ilimitado (∞)** |
| **Clientes na Base** | 100 clientes | 1.500 clientes | 8.000 clientes | **Ilimitado (∞)** |
| **Colaboradores / Equipe** | 2 pessoas | 5 pessoas | 20 pessoas | **Ilimitado (∞)** |
| **Serviços & Links** | 10 serv. / 2 links | 30 serv. / 10 links | 100 serv. / 30 links | **Ilimitado (∞)** |
| **Sinal Mercado Pago** | Sim | Sim | Sim | Sim |
| **Cartão Fidelidade Digital** | — | — | Sim | Sim |
| **Módulo de RH & Equipe** | — | — | — | **Exclusivo Premium** |

---

## 🏗️ Arquitetura e Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Single Page Application com Tailwind CSS, Lucide Icons e UI fluida |
| **Backend** | Fastify v4 + TypeScript | Servidor RESTful otimizado de alta velocidade |
| **ORM** | Prisma ORM 5.x | Modelagem e migrations com suporte a PostgreSQL 17 |
| **Banco de Dados** | PostgreSQL 17 | Banco relacional corporativo com suporte relacional avançado |
| **WhatsApp Integration** | Meta Cloud API / HTTP Gateway / wa.me | Envio automatizado e manual de notificações e comprovantes |
| **Gateway de Pagamento** | Mercado Pago API v1 & Subscriptions | Processamento de cobranças PIX, Cartão e Assinaturas Recorrentes |
| **E-mail Transacional** | Nodemailer (Gmail SSL 465) | Envio de e-mails executivos de boas-vindas, verificação e redefinição |

---

## 🛠️ Como Executar o Projeto Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/thevigillant/boramarka.git
cd boramarka
```

### 2. Configurar o Backend (PostgreSQL 17)
```bash
cd backend
npm install
# Certifique-se de configurar o DATABASE_URL no backend/.env (ex: postgresql://postgres:postgres@localhost:5432/boramarka)
npx prisma generate
npx prisma db push
npx prisma db seed
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

## 📄 Licença

Este projeto é um software proprietário mantido por **BoraMarka** (Bruno Santana Reis). Todos os direitos reservados.


