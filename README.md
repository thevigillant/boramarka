# 🚀 BoraMarka — Plataforma SaaS de Agendamento Online & Gestão Inteligente

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em_Produção-emerald?style=for-the-badge&logo=vercel" alt="Status">
  <img src="https://img.shields.io/badge/PWA-Instalável_Android%2FiOS-ec4899?style=for-the-badge&logo=pwa" alt="PWA">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_v4_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Database-Prisma_5_%2B_PostgreSQL-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Gateway-Mercado_Pago_API_v1-009EE3?style=for-the-badge&logo=mercadopago" alt="Mercado Pago">
  <img src="https://img.shields.io/badge/Segurança-RBAC_%2B_Fastify_Shield-violet?style=for-the-badge&logo=shield" alt="Security">
</p>

---

## 🌐 Endereços Oficiais em Produção

* 🌐 **Plataforma Web (Domínio Próprio):** [https://boramarka.com.br](https://boramarka.com.br) | [https://www.boramarka.com.br](https://www.boramarka.com.br)
* ⚡ **API Backend (Railway Cluster):** [https://api.boramarka.com.br](https://api.boramarka.com.br)
* 📦 **Repositório GitHub:** [`thevigillant/boramarka`](https://github.com/thevigillant/boramarka)

---

## 💡 Sobre o BoraMarka

O **BoraMarka** é uma plataforma SaaS (*Software as a Service*) de alta performance projetada para revolucionar a rotina de profissionais autônomos e estabelecimentos comerciais que atendem com hora marcada. 

A plataforma reúne em um único ecossistema: **Agendamento Online 24/7**, **Cobrança de Sinal Antecipado via Mercado Pago**, **Login de Colaborador por Empresa**, **Matriz de Segurança & Permissões Granulares (RBAC)**, **Cartão Fidelidade Digital**, **Onboarding Inteligente por Nicho**, **Venda Casada (Upsell)**, **Notificações Automáticas via WhatsApp & Web Push**, **Fluxo de Caixa com Exportação em PDF/Excel** e **Gestão de Equipe & RH**.

### 🎯 Para quem foi feito:
- 💈 **Barbearias** & Barbeiros
- 💅 **Salões de Beleza, Manicures & Esmalterias**
- ✒️ **Estúdios de Tatuagem & Piercing**
- 🧴 **Clínicas de Estética, Lash Designers & Sobrancelhas**
- 🏋️ **Personal Trainers, Fisioterapeutas & Profissionais de Saúde**
- 🐾 **Pet Shops & Serviços de Banho e Tosa**
- 🩺 **Consultórios & Clínicas Médicas**

---

## 💎 Destaques & Funcionalidades Principais

### 👔 Login de Colaborador & Identificação por Empresa
- **Acesso em 2 Modalidades:** Alternância entre **Gestor / Empresa** (usuário principal da empresa) e **Colaborador / Equipe** (Identificador da Empresa + Nome do Operador + Senha).
- **Validação de Credenciais em 3 Vias:** O backend valida o identificador da empresa (`companyUsername`) atrelado ao nome do operador (`operatorUsername`), impedindo acessos indevidos.
- **Identificação Visual:** Exibição do distintivo da empresa (`@empresa`) e do perfil de operador ativo no cabeçalho e modal de perfil.

### 🛡️ Matriz de Segurança & Controle de Acessos Granular (RBAC)
- **Perfis Rápidos Pré-configurados (1-Clique):** Seleção ágil entre *Gestor Principal*, *Gerente de Operação*, *Recepcionista*, *Financeiro* e *Profissional*.
- **Controle Defensivo Módulo a Módulo:** Atribuição individual de permissões para os módulos de *Agenda*, *Estornos*, *Clientes*, *Horários*, *Serviços*, *Links*, *Cupons*, *Assinaturas*, *Financeiro*, *RH*, *Segurança*, *Personalização*, *Social*, *Audit Logs* e *Lixeira*.

### 🎨 Design System & Tema Claro como Padrão
- **Tema Claro (Modo Branco) Padrão:** Apresentação visual limpa baseada em paleta slate neutra (`#F8FAFC`), bordas suaves e contraste executivo de alta definição, eliminando brilhos estourados.
- **Modo Escuro (`.dark`) com Alternância:** Suporte completo a tema escuro futurista com persistência imediata no `localStorage`.

### 🚀 Onboarding Personalizado por Nicho (Auto-Seeding)
- Ao se cadastrar, o profissional escolhe o seu nicho de atuação (Barbearia, Salão, Tatuagem, Estética, Personal, Pet Shop, Clínicas).
- O sistema popula automaticamente o catálogo inicial com **3 serviços de alta conversão** customizados com nomes, preços e durações recomendados para o seu setor.

### 📱 PWA Nativo (App Instalável no Celular)
- Suporte completo a Progressive Web App via `manifest.json`.
- Permite a instalação nativa do BoraMarka na tela inicial em dispositivos Android, iOS (Safari) e Desktops.
- Banner flutuante inteligente (`PWAInstallBanner.tsx`) com instruções guiadas para iPhone/iPad.

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

### 📄 Exportação de Dados Financeiros e de Agendamentos
- **Relatórios em PDF**: Relatórios estruturados de fluxo de caixa e agendamentos com logomarca e período customizável.
- **Planilhas CSV (UTF-8 BOM)**: Exportação compatível com Microsoft Excel sem problemas de acentuação.

### 🔒 Segurança Defensiva & Audit Logs
- Proteção contra vulnerabilidades com **Fastify Helmet** (HTTP Headers de segurança) e **Rate Limiting** (120 req/min por IP).
- Auditoria de acessos (`AuditLog`) rastreando IP de origem, Navegador, Sistema Operacional e Nível de Risco.

---

## 🏗️ Arquitetura e Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Single Page Application com Tailwind CSS, Lucide Icons e UI fluida |
| **Backend** | Fastify v4 + TypeScript | Servidor RESTful otimizado de alta velocidade |
| **ORM** | Prisma ORM 5.x | Modelagem e migrations com suporte a SQLite (Dev) e PostgreSQL (Prod) |
| **Banco de Dados** | SQLite / PostgreSQL | Banco de dados relacional com relatórios otimizados |
| **Gateway de Pagamento** | Mercado Pago API v1 | Processamento de cobranças PIX, Cartão e Refunds |
| **E-mail Transacional** | Nodemailer (Gmail SSL 465) | Envio resiliente de códigos de verificação de 4 dígitos |
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
