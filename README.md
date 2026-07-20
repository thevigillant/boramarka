# 🚀 BoraMarka — Sua agenda cheia, sem complicação

O **BoraMarka** é uma plataforma SaaS (Software as a Service) de altíssimo nível para agendamento online, gestão financeira, controle de RH/equipe, segurança auditada e CRM. Projetada especificamente para profissionais autônomos e estabelecimentos (barbeiros, manicures, clínicas, estéticas, salões de beleza, consultores e prestadores de serviços).

A plataforma permite que os profissionais tenham total autonomia sobre suas agendas por meio de links de agendamento inteligentes, gerenciem suas finanças com fluxo de caixa, controlem a equipe de funcionários, acompanhem logs de auditoria e segurança em tempo real e se conectem em uma rede social integrada de networking profissional.

---

## ✨ Identidade da Marca (Brand Identity)

- **Slogan Oficial:** *"Sua agenda cheia, sem complicação."*
- **Símbolo / Logo:** **Shaka Hangloose Neon (Rosa & Violeta) + Checkmark (Esmeralda)**. Representa a vibração acolhedora e descontraída (*"Bora!"*) combinada com a precisão da confirmação (*"Marka!"*).
- **Aesthetic:** Dark Mode Profundo (`#050507`), Glassmorphism, Doppelrand Cards e responsividade completa para dispositivos móveis (iOS & Android).

---

## 🛠️ Funcionalidades Principais

### 🔍 Busca Global Inteligente (Atalho `Ctrl + K` / `Cmd + K`)
- **Pesquisa Instantânea no Cabeçalho:** Campo de busca com ativação via atalho de teclado global `Ctrl + K`.
- **Filtro Unificado em Tempo Real:** Pesquisa simultânea por nome de clientes, agendamentos, serviços, links de venda e lançamentos financeiros com direcionamento em 1 clique.

### 💼 Gestão de RH & Equipe
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
- **Links de Venda Dedicados:** Links personalizáveis no formato `boramarka.com/p/@username` para divulgação direta aos clientes.
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
- **Explorar Rede:** Espaço para descobrir profissionais cadastrados na plataforma (com filtro de segurança para perfis administrativos).
- **Chat em Tempo Real (DMs):** Mensagens diretas e chat interativo com histórico completo de conversas.

### 📊 Gestão Financeira & Relatórios PDF
- **Fluxo de Caixa:** Lançamentos rápidos de contas a pagar (Saídas) e a receber (Entradas) com controle de status de pagamento.
- **Exportação de Relatórios PDF:** Emissão de relatórios estruturados baseados nos filtros de período de tempo, com opção de incluir logotipo personalizado da empresa.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React + Vite, Tailwind CSS, Lucide React, Glassmorphism UI.
- **Backend:** Fastify (suporte a payloads de até 50MB), Prisma ORM.
- **Banco de Dados:** SQLite (Desenvolvimento) / PostgreSQL (Produção).
- **Segurança & Autenticação:** JWT (JSON Web Tokens), `bcryptjs`, Rastreamento de IP e User-Agent, Níveis de Severidade de Auditoria.

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
*BoraMarka — Sua agenda cheia, sem complicação.*
