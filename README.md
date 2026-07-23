# 🚀 BoraMarka — Sua agenda cheia, sem complicação

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em_Produção-emerald?style=for-the-badge&logo=vercel" alt="Status">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Database-Prisma_%2B_PostgreSQL-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Gateway-Mercado_Pago_API_v1-009EE3?style=for-the-badge&logo=mercadopago" alt="Mercado Pago">
  <img src="https://img.shields.io/badge/Deploy-Vercel_%2B_Railway-000000?style=for-the-badge&logo=railway" alt="Deploy">
</p>

---

## 🌐 Endereços Oficiais em Produção

* 🌐 **Plataforma Web (Domínio Próprio):** [https://boramarka.com.br](https://boramarka.com.br) | [https://www.boramarka.com.br](https://www.boramarka.com.br)
* ⚡ **API Backend (Railway Cluster):** [https://api.boramarka.com.br](https://api.boramarka.com.br)
* 📦 **Repositório GitHub:** [`thevigillant/boramarka`](https://github.com/thevigillant/boramarka)

---

## 💡 Sobre o BoraMarka

O **BoraMarka** é uma plataforma SaaS (*Software as a Service*) de alta performance projetada para agendamento online inteligente, cobrança antecipada com Mercado Pago, gestão financeira automatizada de fluxo de caixa, controle completo de RH com arquivo morto, logs de auditoria de segurança e networking profissional.

Desenvolvido para **profissionais autônomos e estabelecimentos comerciais** (barbeiros, manicures, clínicas estéticas, salões de beleza, consultores e prestadores de serviço), o BoraMarka oferece total autonomia para que o profissional reduza o *no-show* a zero, automatize confirmações via WhatsApp e receba pagamentos diretamente na sua conta bancária.

---

## ✨ Identidade da Marca & Design System

* 💬 **Slogan Oficial:** *"Sua agenda cheia, sem complicação."*
* 🤙 **Símbolo / Logo:** **Shaka Hangloose Neon (Rosa `#ec4899` & Violeta `#8b5cf6`) + Checkmark (Esmeralda `#10b981`)**. Representa a energia acolhedora (*"Bora!"*) unida à confirmação instantânea de agendamento (*"Marka!"*).
* 🎨 **Aesthetic:** Dark Mode Profundo (`#050507`), Glassmorphism avançado, Doppelrand Cards, micro-animações fluidas e tipografia fluida com `clamp()` 100% otimizada para smartphones (iOS e Android).
* 📱 **Mockup 3D Ultra-Premium na Landing Page**: Celular interativo com chassis estilo Titanium usinado, Dynamic Island, barra de status ativa e simulador em tempo real de agendamento, pagamento de sinal e cancelamento.

---

## 🛠️ Funcionalidades Principais

### 💳 Integração Completa Mercado Pago (Produção & Taxa de Sinal)
- **Cobrança de Sinal dos Clientes Finais**: O cliente faz a reserva e paga uma taxa de sinal ou o valor total do serviço. O dinheiro cai **diretamente na conta do Mercado Pago do profissional**.
- **Assinaturas da Plataforma BoraMarka**: Cobrança automatizada dos planos de assinatura do BoraMarka (Mensal, Anual e Premium) integrada à conta oficial da plataforma.
- **Redirecionamento Automático (`auto_return: approved`)**: Retorno instantâneo para a tela de confirmação após o pagamento via PIX ou Cartão de Crédito.
- **Webhooks em Tempo Real**: Atualização instantânea dos status de agendamentos e assinaturas no banco de dados assim que o pagamento for aprovado.

### 🔑 Código de Cancelamento & Gestão via WhatsApp
- **Código de Gerenciamento Exclusivo**: Cada agendamento gera um código alfanumérico único (ex: `BM-9A82`).
- **Mensagens Automáticas com Link Direto**: Notificação enviada ao WhatsApp do cliente com o código e um link direto para remarcar ou cancelar (`/agendar/cancelar/TOKEN/BOOKING_ID?code=BM-9A82`).
- **Olhinho de Visualizar Senha**: Alternador de visibilidade de senha (*toggle eye*) em todos os formulários de autenticação e redefinição.

### ⚠️ Central de Estornos & Reembolso Automatizado
- **Solicitações de Estorno Pendentes**: Agendamentos cancelados com sinal pago têm o horário liberado na agenda instantaneamente e entram na **Central de Estornos** do profissional.
- **Botão "Realizar Estorno" no Dashboard**:
  - Aciona a API de reembolsos do Mercado Pago (`POST /v1/payments/{mpPaymentId}/refunds`).
  - Atualiza o status do agendamento para `ESTORNADO` (`refundStatus = "REFUNDED"`).
  - Lança o débito de saída no **Fluxo de Caixa**.
  - Notifica o cliente via WhatsApp confirmando a devolução do valor.

### 🔒 Autenticação & Verificação por E-mail (Código PIN de 4 Dígitos)
- **Template E-mail Premium Dark**: Mensagens transacionais estilizadas em dark mode com cartões 2FA Key e suporte a Gmail, Outlook e Apple Mail.
- **Conta SMTP Oficial**: `contatoboramarka@gmail.com` integrada com suporte a códigos temporários de 4 dígitos (validade de 10 minutos).
- **Validação Anti-Duplicidade**: Verificação de cadastro prévio e proteção de dados.

### 📅 Agenda Inteligente & Conclusão Rápida em 1 Clique
- **Conclusão Rápida em 1-Click**: Checkbox no Dashboard para concluir agendamentos, atualizando o status para `CONCLUIDO` e lançando o faturamento no fluxo de caixa automaticamente.
- **Barra de Anotações Inline**: Campo rápido nos cards de agendamento para salvar e editar observações sobre o cliente.
- **Links de Venda Personalizados**: URLs no formato `boramarka.com.br/p/@username`.
- **Slots em Lote**: Geração automática de horários por intervalo configurável.

### 🔍 Busca Global Inteligente (`Ctrl + K` / `Cmd + K`)
- Ativação global via atalho de teclado.
- Pesquisa unificada por clientes, agendamentos, serviços, links e lançamentos financeiros com navegação direta.

### 💼 Gestão de RH & Arquivo Morto
- Cadastro completo de colaboradores com fotos, documentos, salários e comissões.
- Controle de demissões e pendências (*Equipamentos, Financeira, Documentos, Outros*).
- Arquivo Morto organizado para ex-funcionários com histórico mantido.

### 🛡️ Audit Logger & Logs de Segurança
- Identificação de IP via Cloudflare / Proxies (`CF-Connecting-IP`, `X-Forwarded-For`).
- Detecção de Sistema Operacional e Navegador via parser de `User-Agent`.
- Classificação por severidade de risco (Crítico, Alto, Médio e Informativo) com visualização em linha do tempo.

### 📅 Sincronização Bidirecional com Google Calendar
- Conexão nativa com a agenda Google do profissional.
- Bloqueio automático de *double booking* caso haja compromissos pessoais no Google Calendar.

### 📊 Fluxo de Caixa & Exportação em PDF
- Registro de Entradas (Recebimentos) e Saídas (Despesas/Estornos).
- Emissão de relatórios estruturados em PDF com logomarca e filtros personalizados.

---

## 🏗️ Arquitetura e Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Interface SPA ultrarrápida com Tailwind CSS, Lucide Icons e Glassmorphism |
| **Backend** | Fastify + TypeScript | Servidor HTTP RESTful de alta performance |
| **ORM** | Prisma ORM | Modelagem de dados com suporte dual a SQLite (Dev) e PostgreSQL (Prod) |
| **Banco de Dados** | SQLite / PostgreSQL | Banco de dados local para dev e PostgreSQL gerenciado no Railway para prod |
| **Gateway de Pagamento** | Mercado Pago SDK | Processamento de PIX, cartão, preferências checkout e refunds |
| **Deploy Frontend** | Vercel | Deploy contínuo com SSL e distribuição Edge global |
| **Deploy Backend** | Railway | Containerização e infraestrutura escalável |
| **Segurança** | JWT & `bcryptjs` | Autenticação segura, hashes de senha e tokens revogáveis |

---

## 📂 Estrutura do Projeto

```
Sistema Marcação/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Entidades da base de dados (Bookings, RefundStatus, etc)
│   │   └── dev.db              # Banco SQLite de desenvolvimento
│   ├── src/
│   │   ├── routes/             # Rotas Fastify (auth, admin, schedule, billing, RH, audit)
│   │   ├── services/           # Lógicas de negócio (WhatsApp, Mercado Pago, email)
│   │   ├── scripts/            # Scripts de automação e testes (testRefund, testEmail)
│   │   ├── utils/              # Audit logger, parser de IP/User-Agent
│   │   ├── db.ts               # Instância do PrismaClient
│   │   └── server.ts           # Servidor Fastify principal
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Modais, Navbar, Busca Global, Cards, Logo 3D
│   │   ├── pages/              # Landing, Login, Register, Dashboard, BookingCancel
│   │   ├── services/           # Cliente API Axios/Fetch unificado
│   │   ├── utils/              # Exportação de relatórios PDF, formatadores de moeda
│   │   ├── App.tsx             # Gerenciador de rotas
│   │   └── main.tsx            # Entry point Vite
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Como Executar Localmente

### 🔧 Pré-requisitos
* Node.js v18+ instalado.
* NPM ou Yarn.

### 📦 1. Configuração do Backend
```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Sincronizar o banco de dados SQLite local
npx prisma db push

# Iniciar o servidor de desenvolvimento
npm run dev
```
*Servidor rodando em **http://localhost:3001**.*

### 🎨 2. Configuração do Frontend
```bash
# Entrar na pasta do frontend
cd ../frontend

# Instalar dependências
npm install

# Iniciar a aplicação web
npm run dev
```
*Aplicação web rodando em **http://localhost:5173**.*

---

## 📄 Licença & Créditos

Desenvolvido com 💖 pela equipe **BoraMarka**. Todos os direitos reservados.

*BoraMarka — Sua agenda cheia, sem complicação.*
