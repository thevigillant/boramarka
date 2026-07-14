# 🚀 BoraMarka

O **BoraMarka** é uma plataforma SaaS (Software as a Service) premium completa de agendamento online, gestão financeira, rede de networking e CRM, projetada especificamente para profissionais autônomos e estabelecimentos (como barbeiros, manicures, clínicas, consultores e salões de beleza).

A plataforma permite que os profissionais tenham total autonomia sobre suas agendas por meio de links de agendamento inteligentes, gerenciem suas finanças com fluxo de caixa, controlem clientes recorrentes com um CRM nativo e se conectem em uma rede social integrada de networking profissional.

---

## ✨ Funcionalidades Principais

### 📅 Agenda Inteligente & Multi-Agendamento
- **Links de Venda Dedicados:** Links personalizáveis no formato `boramarka.com/p/@username` para divulgação direta para seus clientes.
- **Geração de Slots em Lote:** Criação inteligente de horários disponíveis em bloco (por intervalo de minutos) ou horários específicos únicos.
- **Catálogo de Serviços:** Apresentação elegante com nome, duração, descrição e preço de cada serviço oferecido.
- **Página de Agendamento Pública:** Interface fluida e responsiva para o cliente final escolher o serviço, horário disponível e confirmar informando nome e WhatsApp.

### 📅 Sincronização com Google Calendar
- **Sincronização Bidirecional:** Conecte sua conta do Google para sincronização automática com a agenda pessoal do profissional.
- **Bloqueio de Double Booking:** O sistema detecta compromissos pessoais externos marcados no Google Calendar e bloqueia automaticamente os slots equivalentes no BoraMarka para evitar conflitos de horário.

### 👥 CRM & Relacionamento com Clientes
- **Painel de Relacionamento:** Lista dinâmica de clientes com histórico completo de interações e contatos.
- **Métricas por Cliente:** Valor total investido (faturamento gerado) e número total de agendamentos confirmados pelo cliente.
- **Anotações Privadas:** Espaço dedicado para o profissional registrar preferências, fichas de anamnese ou observações técnicas sobre o cliente.

### 🌐 Rede de Networking & Chat Global
- **Explore:** Espaço estilo rede social (Instagram/LinkedIn da beleza) para descobrir profissionais cadastrados na plataforma.
- **Busca Avançada:** Filtros rápidos por nome, negócio, especialidade ou localização.
- **Chat em Tempo Real (DMs):** Sistema interno de mensagens diretas e chat interativo com histórico completo de conversas para negociações e parcerias comerciais.

### 💳 Clube de Assinaturas (Recorrência) & Cupons
- **Clube de Assinaturas:** Permite que profissionais criem clubes de fidelidade, onde clientes pagam mensalidades fixas para garantir atendimentos recorrentes (ex: 4 cortes de cabelo no mês por valor fixo).
- **Sistema de Cupons:** Criação de cupons de desconto fixos ou percentuais para impulsionar as vendas e fidelizar clientes.

### 👑 Painel do Administrador Geral (SuperAdmin)
- **Saúde do Negócio:** Visualização em tempo real de estatísticas de faturamento mensal estimado, total de clientes ativos, trial e assinaturas ativas.
- **Controle de Usuários:** Gerenciamento total das contas dos profissionais cadastrados (visualizar dados, alterar planos de assinatura e excluir contas).
- **Acesso Impersonation (Login como Cliente):** O administrador geral pode acessar com um clique o painel de qualquer profissional para suporte, com botão de escape rápido ("Voltar SuperAdmin") ativo no cabeçalho do profissional.
- **Botão "Usar como Profissional":** Atalho na navbar para o próprio dono usar a plataforma como profissional.

### 🔒 Período de Experiência & Paywall (SaaS)
- **7 Dias de Teste Grátis:** Ativação automática no cadastro.
- **Cronômetro regressivo em tempo real:** Exibido no topo do painel do profissional.
- **Paywall Elegante:** Bloqueio inteligente (modo de visualização apenas) com restrição de novos agendamentos e edições no término do trial, liberando acesso somente após assinatura integrada via Mercado Pago.

---

## 🛠️ Stack Tecnológica

O projeto adota uma arquitetura moderna, de alta performance e totalmente escrita em **TypeScript**:

### 🖥️ Frontend (Interface do Usuário)
- **Framework principal:** [React](https://react.dev/) com [Vite](https://vite.dev/) (build ultra rápido)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (design moderno com suporte completo a Dark/Light mode)
- **Roteamento:** [React Router DOM](https://reactrouter.com/)
- **Pacote de Ícones:** [Lucide React](https://lucide.dev/)
- **Integração HTTP:** Axios com gerenciamento de tokens JWT

### ⚙️ Backend (Serviço de API)
- **Framework principal:** [Fastify](https://fastify.dev/) (alternativa de alta velocidade e baixo consumo de memória ao Express)
- **ORM:** [Prisma ORM](https://www.prisma.io/)
- **Banco de Dados:** SQLite (padrão de desenvolvimento rápido) / PostgreSQL (pronto para produção)
- **Segurança & Autenticação:** JWT (JSON Web Tokens) e encriptação de senhas com `bcrypt`

---

## 💾 Modelo de Dados (Prisma Schema)

O banco de dados é estruturado de forma a suportar o ecossistema SaaS completo:

- **Admin:** Representa o profissional ou estabelecimento. Contém configurações de perfil, cores personalizadas para sua página pública (`accentColor`, `secondaryColor`, `publicTheme`), chaves de API, credenciais do Google Calendar e status de assinatura.
- **Subscription:** Controla o status do plano do profissional (trialing, active, inactive) e datas de expiração e término do trial.
- **Service:** Catálogo de serviços oferecidos com nome, duração e preço.
- **SchedulingLink:** Link único (`token`) com taxa de reserva opcional (`bookingFeeEnabled`).
- **TimeSlot & Booking:** Gerencia os horários abertos para agendamento e as reservas confirmadas pelos clientes.
- **Transaction:** Fluxo de caixa para controle financeiro (entradas/saídas).
- **Coupon:** Gerenciador de cupons de descontos para promoções.
- **MembershipPlan & ClientSubscription:** Controla os planos de recorrência que o profissional oferece aos seus clientes finais.
- **ClientNote:** Anotações privadas sobre os clientes feitas pelo profissional.
- **ChatMessage:** Mensagens diretas trocadas entre os profissionais na rede social interna.

---

## 🚀 Como Executar Localmente

### 🔧 Pré-requisitos
Certifique-se de possuir o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 📦 1. Configuração do Backend
1. Navegue até o diretório do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie e configure o arquivo `.env` na raiz da pasta `backend`:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="sua_chave_secreta_super_forte"
   MERCADO_PAGO_ACCESS_TOKEN="seu_token_do_mercado_pago"
   GOOGLE_CLIENT_ID="seu_google_client_id"
   GOOGLE_CLIENT_SECRET="seu_google_client_secret"
   ```
4. Execute as migrações/criação do banco de dados:
   ```bash
   npx prisma db push
   ```
5. Inicie o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   *O backend estará rodando na porta **3001**.*

### 🎨 2. Configuração do Frontend
1. Navegue até o diretório do frontend:
   ```bash
   cd ../frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   *O frontend estará rodando no endereço [http://localhost:5173](http://localhost:5173).*

---

## 📂 Estrutura de Diretórios

```text
├── backend/
│   ├── prisma/                  # Configurações do Prisma ORM e Schema do Banco
│   └── src/
│       ├── plugins/             # Middleware de autenticação JWT e Fastify Setup
│       ├── routes/              # Definição dos endpoints da API (Autenticação, Clientes, Financeiro, Agendamento, etc)
│       ├── services/            # Integração com Google Calendar e Lembretes automáticos
│       └── server.ts            # Arquivo inicializador do servidor Fastify
├── frontend/
│   ├── public/                  # Assets estáticos e públicos (imagens, ícones)
│   └── src/
│       ├── pages/               # Telas principais (Dashboard, SuperAdmin, Landing Page, Perfil Público, Login/Cadastro)
│       ├── services/            # Comunicação HTTP (API Client com Axios)
│       ├── index.css            # Estilos globais e configurações de tema do Tailwind
│       └── App.tsx              # Rotas e configurações globais do React
└── README.md
```

---
*BoraMarka — Gestão inteligente, networking dinâmico e agendamento sem complicações.*
