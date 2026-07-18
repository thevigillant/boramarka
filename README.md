# 🚀 BoraMarka

O **BoraMarka** é uma plataforma SaaS (Software as a Service) premium completa de agendamento online, gestão financeira, controle de RH / equipe, segurança auditada e CRM, projetada especificamente para profissionais autônomos e estabelecimentos (como barbeiros, manicures, clínicas, consultores, estéticas e salões de beleza).

A plataforma permite que os profissionais tenham total autonomia sobre suas agendas por meio de links de agendamento inteligentes, gerenciem suas finanças com fluxo de caixa, controlem a equipe de funcionários, acompanhem logs de auditoria e segurança em tempo real e se conectem em uma rede social integrada de networking profissional.

---

## ✨ Funcionalidades Principais

### 💼 Gestão de RH & Equipe (Exclusivo no Plano Premium — R$ 69,90/mês)
- **Equipe Ativa:** Cadastro completo de colaboradores com foto/iniciais, CPF, RG, data de nascimento, data de admissão, salário base, porcentagem de comissão e carga horária.
- **Anexo & Gestão de Documentos:** Envio de arquivos e documentos vinculados ao colaborador (contratos, holerites, atestados, RG/CPF) com suporte a limite de 50MB, indicador de validade/expiração e download direto.
- **Fluxo de Demissão & Controle de Pendências:** Processo estruturado de desligamento com registro de motivo, data e anotações. Categorização de pendências (*Equipamentos, Financeira, Documentos, Outros*), permitindo filtrar ex-colaboradores com pendências em aberto e resolver com 1 clique.
- **Arquivo Morto:** Histórico organizado de ex-funcionários com pendências resolvidas, permitindo reativação rápida para a equipe ativa ou exclusão definitiva com confirmação de segurança.

### 🛡️ Logs & Auditoria de Segurança Avançada
- **Resolução Inteligente de IP:** Identificação do IP do cliente através dos cabeçalhos Cloudflare (`CF-Connecting-IP`), proxies (`X-Real-IP`, `X-Forwarded-For`, `X-Client-IP`), com indicação clara de conexões de desenvolvimento local (`127.0.0.1 (Localhost / Loopback)`).
- **Detecção de Dispositivo & Navegador:** Parser de `User-Agent` para identificação do Sistema Operacional (*Windows, macOS, Linux, Android, iOS*) e Navegador (*Chrome, Edge, Firefox, Safari, Opera*).
- **Classificação por Severidade de Segurança:**
  - 🚨 **CRÍTICO:** Exclusões definitivas de serviços, cupons, colaboradores, documentos e trocas de senha (*destacado em vermelho pulsante*).
  - ⚠️ **ALTO:** Demissões, arquivamentos no Arquivo Morto e criação de cupons de desconto (*destacado em amarelo*).
  - 🔮 **MÉDIO:** Adição ou atualização de serviços, alteração de cadastro de funcionários (*destacado em roxo*).
  - ℹ️ **INFORMATIVO:** Logins efetuados e consultas de relatórios (*destacado em azul*).
- **Timeline Interativa no Dashboard:** Linha do tempo com busca textual dinâmica (por usuário, IP ou descrição) e filtros por categoria ou severidade de risco.

### 📅 Agenda Inteligente & Multi-Agendamento
- **Links de Venda Dedicados:** Links personalizáveis no formato `boramarka.com/p/@username` para divulgação direta para seus clientes.
- **Geração de Slots em Lote:** Criação inteligente de horários disponíveis em bloco (por intervalo de minutos) ou horários específicos únicos.
- **Catálogo de Serviços Click-to-Book:** Apresentação elegante com nome, duração, descrição e preço de cada serviço oferecido.

### 🔄 Portal do Cliente Online (Cancelamentos & Remarcação)
- **Portal de Auto-atendimento:** Links seguros enviáveis por WhatsApp que permitem ao cliente final cancelar ou remarcar o próprio horário com 1 clique (sem necessidade de login).
- **Remarcação Integrada:** Seletor de slots livre no calendário com validação da antecedência limite configurada (ex: antecedência de 2 horas).
- **Mensagens Dinâmicas:** Disparo automatizado de WhatsApp com o comprovante e link do portal estruturado de maneira profissional.

### 📅 Sincronização com Google Calendar
- **Sincronização Bidirecional:** Conecte sua conta do Google para sincronização automática com a agenda pessoal do profissional.
- **Bloqueio de Double Booking:** O sistema detecta compromissos pessoais externos marcados no Google Calendar e bloqueia automaticamente os slots equivalentes no BoraMarka.

### 👥 CRM & Relacionamento com Clientes
- **Painel de Relacionamento:** Lista dinâmica de clientes com histórico completo de interações, anotações de progresso e histórico de agendamentos.
- **Métricas por Cliente:** Valor total investido (faturamento gerado) e número total de agendamentos confirmados pelo cliente.

### 🌐 Rede de Networking & Chat Global
- **Explore:** Espaço estilo rede social para descobrir profissionais cadastrados na plataforma.
- **Chat em Tempo Real (DMs):** Sistema interno de mensagens diretas e chat interativo com histórico completo de conversas.

### 💳 Clube de Assinaturas & Cupons
- **Clube de Assinaturas:** Permite que profissionais criem clubes de fidelidade com cobrança mensal recorrente.
- **Sistema de Cupons:** Criação de cupons de desconto fixos ou percentuais para impulsionar vendas.

### 👑 Painel do Administrador Geral (SuperAdmin)
- **Saúde do Negócio:** Visualização em tempo real de estatísticas de faturamento mensal estimado, total de clientes ativos, trial e assinaturas ativas.
- **Acesso Impersonation (Login como Cliente):** O administrador geral pode acessar com um clique o painel de qualquer profissional para suporte técnico, com botão de escape rápido.

---

## 🎨 Design & Visual Premium (Aesthetics)
- **Atmosphere Glow & Mesh Orbs:** Fundo escuro profundo (`#050507`) com orbs coloridos desfocados em movimento e textura de grãos sutil.
- **Doppelrand Card System:** Estilo de bordas duplas finas com luzes direcionais que respondem ao mouse (efeito Lift 3D e Glow).
- **Glassmorphism Navbar:** Menu flutuante em formato de ilha translúcida com efeitos de desfoque.
- **Pills de Navegação:** Transições e gradientes animados violeta-rosa nas tabs.

---

## 🛠️ Stack Tecnológica

- **Frontend:** [React](https://react.dev/) + [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/), [React Router DOM](https://reactrouter.com/), [Lucide React](https://lucide.dev/).
- **Backend:** [Fastify](https://fastify.dev/) (com suporte a payloads de até 50MB), [Prisma ORM](https://www.prisma.io/).
- **Banco de Dados:** SQLite (desenvolvimento) / PostgreSQL (produção).
- **Segurança & Autenticação:** JWT (JSON Web Tokens), `bcryptjs`, Rastreamento de IP e User-Agent, Níveis de Severidade de Auditoria.

---

## 💾 Modelo de Dados (Prisma Schema)

- **Admin:** Perfil do profissional, chaves de API, credenciais e configurações de tema.
- **Subscription:** Controle de trial e plano Premium (R$ 69,90/mês).
- **Employee & EmployeeDocument:** Gestão completa de funcionários (ativos, demitidos com pendência, arquivo morto) e anexos gravados com suporte a arquivos grandes.
- **AuditLog:** Registro de auditoria contendo ação, entidade, detalhes, IPAddress, UserAgent, DeviceInfo, Severity, UserName, UserRole e AdminId.
- **Service, SchedulingLink, TimeSlot, Booking:** Módulo de agendamentos e catálogos.
- **Transaction, Coupon, MembershipPlan:** Módulo financeiro e fidelidade.
- **ChatMessage, ClientNote:** CRM e rede de networking.

---

## 🚀 Como Executar Localmente

### 🔧 Pré-requisitos
Possuir [Node.js](https://nodejs.org/) instalado.

### 📦 1. Configuração do Backend
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
*Servidor rodando em **http://localhost:3001**.*

### 🎨 2. Configuração do Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*Aplicação web rodando em **http://localhost:5173**.*

---
*BoraMarka — Gestão inteligente de RH, auditoria de segurança, networking e agendamento sem complicações.*
