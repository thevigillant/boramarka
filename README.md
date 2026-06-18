# 🚀 BoraMarka

BoraMarka é um sistema SaaS (Software as a Service) completo de agendamento online e gestão financeira voltado para profissionais autônomos (barbeiros, manicures, consultores, etc).

Ele permite que profissionais gerenciem seus horários, ofereçam links públicos para clientes marcarem horários sozinhos, e controlem o fluxo de caixa do negócio.

## ✨ Funcionalidades (Até o momento)

- **Landing Page Profissional:** Apresentação do produto com modos Claro/Escuro e planos de assinatura.
- **Painel de Controle (Dashboard):** 
  - Estatísticas gerais (total de links, slots disponíveis, recebimentos, pendências).
  - Gestão de Perfil: Edição do perfil público do profissional (@username, nome do negócio, foto, CNPJ, contato e horário de funcionamento).
- **Gestão de Serviços:** Criação de catálogo de serviços com nome, duração e preço.
- **Agenda Inteligente:**
  - Criação de Links de Venda dedicados.
  - Geração de "Slots" (horários disponíveis) em lote com intervalo definido ou como horário único.
  - Calendário visual dinâmico.
- **Perfil Público para Clientes:** Página gerada dinamicamente via `boramarka.com/p/@username` onde clientes veem o catálogo de serviços e escolhem um horário.
- **Agendamento pelo Cliente:** Interface para o cliente final agendar o horário fornecendo Nome e WhatsApp.
- **Fluxo de Caixa:** Gestão financeira (contas a pagar/receber) com listagem detalhada e baixa automática/manual de pagamentos.
- **Integração de Pagamento & Cobrança (SaaS):**
  - Módulo Mercado Pago integrado para assinatura dos planos Mensal e Anual.
- **Período de Experiência (7 Dias Grátis):**
  - Ativação automática de 7 dias grátis de trial no momento do cadastro.
  - Banner dinâmico com contagem regressiva ao vivo em tempo real (dias, horas, minutos, segundos) exibido no painel de controle do profissional.
- **Dashboard em Modo de Visualização (View-Only):**
  - Após a expiração do trial ou plano, o profissional pode navegar no painel e visualizar seus serviços criados, porém todas as ações de edição, criação e demais abas mostram um modal elegante de checkout (Paywall).
- **Suspensão de Agendamentos Públicos:**
  - Bloqueio automático de novas reservas de clientes nos links públicos do profissional caso a conta esteja suspensa ou com trial expirado. A página exibe um aviso claro e oculta os meios de contato do profissional.

## 🛠️ Stack Tecnológica

O projeto adota uma arquitetura fullstack moderna e leve:

### Backend
- **Framework:** Node.js com Fastify (alta performance)
- **Linguagem:** TypeScript
- **Banco de Dados:** SQLite (em desenvolvimento) preparado para migração via Prisma ORM para PostgreSQL
- **Autenticação:** JWT (JSON Web Tokens) e Bcrypt para senhas
- **Integrações:** SDK Mercado Pago e lógica preparada para WhatsApp Cloud API

### Frontend
- **Framework:** React com Vite
- **Roteamento:** React Router DOM
- **Estilização:** Tailwind CSS (focado em um design premium com Dark Mode nativo)
- **Ícones:** Lucide React

## 🚀 Como Executar Localmente

### Backend
1. Entre na pasta `backend`
2. Instale as dependências: `npm install`
3. Crie um arquivo `.env` baseado no `.env.example`
4. Crie/Sincronize o banco de dados: `npx prisma db push`
5. Inicie o servidor: `npm run dev` (O backend rodará na porta 3001)

### Frontend
1. Entre na pasta `frontend`
2. Instale as dependências: `npm install`
3. Inicie a aplicação: `npm run dev` (O frontend rodará na porta 5173)

---
*Projeto em desenvolvimento ativo. MVP estruturado e pronto para implantação.*
