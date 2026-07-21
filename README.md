# 🚀 BoraMarka — Sua agenda cheia, sem complicação

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em_Produção-emerald?style=for-the-badge&logo=vercel" alt="Status">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Database-Prisma_%2B_PostgreSQL-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/Deploy-Vercel_%2B_Railway-000000?style=for-the-badge&logo=railway" alt="Deploy">
</p>

---

## 🌐 Endereços Oficiais em Produção

* 🌐 **Plataforma Web (Domínio Próprio):** [https://boramarka.com.br](https://boramarka.com.br) | [https://www.boramarka.com.br](https://www.boramarka.com.br)
* ⚡ **API Backend (Railway Cluster):** [https://api.boramarka.com.br](https://api.boramarka.com.br)
* 📦 **Repositório GitHub:** `thevigillant/boramarka`

---

## 💡 Sobre o BoraMarka

O **BoraMarka** é uma plataforma SaaS (*Software as a Service*) de altíssimo nível projetada para agendamento online, gestão financeira de fluxo de caixa, controle de RH/equipe com arquivo morto, segurança auditada e networking profissional.

Desenvolvida especialmente para **profissionais autônomos e estabelecimentos comerciais** (barbeiros, manicures, clínicas estéticas, salões de beleza, consultores e prestadores de serviço), a plataforma oferece total autonomia para os profissionais divulgarem seus links de agendamento inteligentes e gerenciarem seus negócios com máxima eficiência.

---

## ✨ Identidade da Marca & Design System

* 💬 **Slogan Oficial:** *"Sua agenda cheia, sem complicação."*
* 🤙 **Símbolo / Logo:** **Shaka Hangloose Neon (Rosa `#ec4899` & Violeta `#8b5cf6`) + Checkmark (Esmeralda `#10b981`)**. Representa a energia acolhedora (*"Bora!"*) unida à confirmação instantânea de agendamento (*"Marka!"*).
* 🎨 **Aesthetic:** Dark Mode Profundo (`#050507`), Glassmorphism avançado, Doppelrand Cards, micro-animações fluidas e 100% responsivo para mobile (iOS e Android).

---

## 🛠️ Funcionalidades Principais

### 🔒 Autenticação & Verificação por E-mail (Código PIN de 4 Dígitos)
- **Modal de Segurança com PIN 4-Dígitos:** Fluxo de cadastro protegido por verificação de e-mail em tempo real.
- **Validação com Expiração:** Códigos numéricos de 4 dígitos válidos por 10 minutos com suporte a contagem regressiva e reenvio.
- **Suporte Duplo SMTP:** Integração nativa com serviços SMTP reais (Gmail, Resend, SendGrid) e Modo de Teste Automático quando em ambiente local.
- **Prevenção de E-mails Duplicados:** Validação prévia de existência de conta antes de disparar verificação.

### 🔍 Busca Global Inteligente (Atalho `Ctrl + K` / `Cmd + K`)
- **Pesquisa Instantânea:** Ativação global via atalho de teclado `Ctrl + K`.
- **Filtro Unificado:** Pesquisa em tempo real por nome de clientes, agendamentos, serviços, links de venda e lançamentos financeiros com redirecionamento em 1 clique.

### 💼 Gestão de RH & Controle de Equipe
- **Equipe Ativa:** Cadastro completo de colaboradores com foto/iniciais, CPF, RG, data de nascimento, admissão, salário base, porcentagem de comissão e carga horária.
- **Anexo & Gestão de Documentos:** Envio de arquivos e documentos vinculados ao colaborador (contratos, holerites, atestados) com suporte a limite de 50MB, indicador de validade e download direto.
- **Fluxo de Demissão & Controle de Pendências:** Registro de desligamento com motivo, data e anotações. Categorização de pendências (*Equipamentos, Financeira, Documentos, Outros*), permitindo filtrar ex-colaboradores com pendências em aberto e resolver com 1 clique.
- **Arquivo Morto:** Histórico organizado de ex-funcionários com pendências resolvidas, permitindo reativação rápida para a equipe ativa ou exclusão definitiva.

### 🛡️ Logs & Auditoria de Segurança Avançada
- **Resolução Inteligente de IP:** Identificação do IP do cliente através dos cabeçalhos Cloudflare (`CF-Connecting-IP`), proxies (`X-Real-IP`, `X-Forwarded-For`), com indicação clara de conexões de desenvolvimento local (`127.0.0.1 (Localhost / Loopback)`).
- **Detecção de Dispositivo & Navegador:** Parser de `User-Agent` para identificação do Sistema Operacional (*Windows, macOS, Linux, Android, iOS*) e Navegador (*Chrome, Edge, Firefox, Safari, Opera*).
- **Classificação por Severidade de Risco:**
  - 🚨 **CRÍTICO:** Exclusões definitivas de serviços, cupons, colaboradores, documentos e trocas de senha (*destacado em vermelho pulsante*).
  - ⚠️ **ALTO:** Demissões, arquivamentos no Arquivo Morto e criação de cupons de desconto (*destacado em amarelo*).
  - 🔮 **MÉDIO:** Adição ou atualização de serviços, alteração de cadastro de funcionários (*destacado em roxo*).
  - ℹ️ **INFORMATIVO:** Logins efetuados e consultas de relatórios (*destacado em azul*).
- **Timeline Interativa no Dashboard:** Linha do tempo com busca textual dinâmica e filtros por categoria ou severidade de risco.

### 📅 Agenda Inteligente & Multi-Agendamento
- **Links de Venda Dedicados:** Links personalizáveis no formato `boramarka.com.br/p/@username` para divulgação direta aos clientes.
- **Geração de Slots em Lote:** Criação inteligente de horários disponíveis em bloco (por intervalo de minutos) ou horários específicos únicos.
- **Catálogo de Serviços Click-to-Book:** Apresentação elegante com nome, duração, descrição e preço de cada serviço oferecido.

### 🔄 Portal do Cliente Online (Cancelamentos & Remarcação)
- **Portal de Auto-atendimento:** Links seguros enviáveis por WhatsApp que permitem ao cliente final cancelar ou remarcar o próprio horário com 1 clique (sem necessidade de login).
- **Remarcação Integrada:** Seletor de slots livre no calendário com validação da antecedência limite configurada.

### 📅 Sincronização com Google Calendar
- **Sincronização Bidirecional:** Conexão automática com a agenda pessoal do profissional.
- **Bloqueio de Double Booking:** O sistema detecta compromissos pessoais externos marcados no Google Calendar e bloqueia automaticamente os slots equivalentes no BoraMarka.

### 👥 CRM & Relacionamento com Clientes
- **Painel de Relacionamento:** Lista dinâmica de clientes com histórico completo de interações, anotações de progresso e histórico de agendamentos.
- **Métricas por Cliente:** Valor total investido (faturamento gerado) e número total de agendamentos confirmados.

### 🌐 Rede de Networking & Chat Global
- **Explorar Rede:** Espaço para descobrir profissionais cadastrados na plataforma.
- **Chat em Tempo Real (DMs):** Mensagens diretas e chat interativo com histórico completo de conversas.

### 📊 Gestão Financeira & Relatórios PDF
- **Fluxo de Caixa:** Lançamentos rápidos de contas a pagar (Saídas) e a receber (Entradas) com controle de status de pagamento.
- **Exportação de Relatórios PDF:** Emissão de relatórios estruturados baseados nos filtros de período de tempo, com opção de incluir logotipo personalizado da empresa.

---

## 🏗️ Arquitetura e Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Interface ultra rápida com Tailwind CSS, Lucide React e Glassmorphism |
| **Backend** | Fastify + TypeScript | Servidor HTTP de alta performance com suporte a payloads de 50MB |
| **ORM** | Prisma ORM | Modelagem de dados com suporte dual a SQLite (Dev) e PostgreSQL (Prod) |
| **Banco de Dados** | SQLite / PostgreSQL | Banco de dados local para dev e PostgreSQL gerenciado no Railway para prod |
| **Hospedagem Frontend** | Vercel | Deploy contínuo com SSL e distribuição Edge global |
| **Hospedagem Backend** | Railway | Infraestrutura escalável em nuvem |
| **Segurança** | JWT & `bcryptjs` | Autenticação segura, hashes de senha e tokens revogáveis |

---

## 📂 Estrutura do Projeto

```
Sistema Marcação/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelagem das entidades do banco
│   │   └── dev.db              # Banco SQLite de desenvolvimento
│   ├── src/
│   │   ├── routes/             # Rotas Fastify (auth, admin, finance, RH, audit, etc)
│   │   ├── services/           # Lógicas de negócio (lembretes, assinaturas, email)
│   │   ├── utils/              # Audit logger, parser de IP/User-Agent
│   │   ├── db.ts               # Instância do PrismaClient
│   │   └── server.ts           # Inicialização do servidor Fastify
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Modais, Navbar, Busca Global, Cards
│   │   ├── pages/              # Landing, Login, Register, Dashboard, RH, Finance, etc
│   │   ├── services/           # Cliente API Axios/Fetch unificado
│   │   ├── utils/              # Gerador de relatórios PDF, formatação de moedas
│   │   ├── App.tsx             # Rotas e gerenciamento de contexto
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
