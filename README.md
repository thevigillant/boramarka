# BoraMarka & BoraEnkomenda — Plataforma SaaS Multi-Tenant Nível Enterprise

<p align="center">
  <img src="https://img.shields.io/badge/Status-Produção_Ativa-00C853?style=for-the-badge&logo=railway&logoColor=white" alt="Status">
  <img src="https://img.shields.io/badge/Domínio-boramarka.com.br-000000?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Domínio">
  <img src="https://img.shields.io/badge/Frontend-React_18_%7C_Vite_5-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_4_%7C_TypeScript_5-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify">
  <img src="https://img.shields.io/badge/Banco_de_Dados-PostgreSQL_17_%7C_Prisma_5-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Protocolo_PIX-Bacen_EMVCo_CRC16-32BCAD?style=for-the-badge&logo=pix&logoColor=white" alt="Protocolo PIX">
  <img src="https://img.shields.io/badge/Segurança-OWASP_Top_10_%7C_LGPD-6D28D9?style=for-the-badge&logo=auth0&logoColor=white" alt="Segurança">
</p>

---

## 📑 Índice Executivo

- [1. Visão Geral do Ecossistema](#1-visão-geral-do-ecossistema)
- [2. Verticais de Negócio Especializadas](#2-verticais-de-negócio-especializadas)
  - [2.1. 📅 BoraMarka — Sistema Operacional para Serviços](#21--boramarka--sistema-operacional-para-serviços)
  - [2.2. 🧁 BoraEnkomenda — Sistema Operacional para Produção & Encomendas](#22--boraenkomenda--sistema-operacional-para-produção--encomendas)
- [3. Arquitetura e Topologia do Sistema](#3-arquitetura-e-topologia-do-sistema)
- [4. Módulos e Motores de Alta Performance](#4-módulos-e-motores-de-alta-performance)
  - [4.1. Motor de Pagamento PIX EMVCo Direto e Mercado Pago](#41-motor-de-pagamento-pix-emvco-direto-e-mercado-pago)
  - [4.2. Motor Fiscal e Gestão de Estoque (NF-e, NFC-e e XML)](#42-motor-fiscal-e-gestão-de-estoque-nf-e-nfc-e-e-xml)
  - [4.3. Motor de Analytics e Inteligência Financeira Unificada](#43-motor-de-analytics-e-inteligência-financeira-unificada)
  - [4.4. Kanban de Produção e Listas de Compras Inteligentes](#44-kanban-de-produção-e-listas-de-compras-inteligentes)
  - [4.5. SuperAdmin e Gestão de Assinaturas em Tempo Real](#45-superadmin-e-gestão-de-assinaturas-em-tempo-real)
- [5. Stack Tecnológico](#5-stack-tecnológico)
- [6. Estrutura do Código-Fonte (Monorepo)](#6-estrutura-do-código-fonte-monorepo)
- [7. Guia de Instalação e Execução Local](#7-guia-de-instalação-e-execução-local)
- [8. Variáveis de Ambiente](#8-variáveis-de-ambiente)
- [9. Segurança, Auditoria e Conformidade LGPD](#9-segurança-auditoria-e-conformidade-lgpd)
- [10. Licença e Propriedade Intelectual](#10-licença-e-propriedade-intelectual)

---

## 1. Visão Geral do Ecossistema

O **BoraMarka** e o **BoraEnkomenda** constituem um ecossistema SaaS de padrão corporativo, desenhado especificamente para digitalizar e escalar negócios autônomos e empresas de serviços e produção sob medida.

Projetada com arquitetura desacoplada, alta concorrência e latência sub-segundo, a plataforma elimina intermediários em transações financeiras, automatiza rotinas fiscais e de estoque e oferece uma experiência visual de alto impacto (Rich Aesthetics, Glassmorphism, Dark Mode e Micro-interações).

---

## 2. Verticais de Negócio Especializadas

A plataforma é dividida em dois pilares operacionais estritamente separados, garantindo foco total no fluxo do profissional:

### 2.1. 📅 BoraMarka — Sistema Operacional para Serviços
- **Público-Alvo**: Barbearias, salões de beleza, estúdios de tatuagem, clínicas de estética, consultórios e profissionais autônomos por hora.
- **Funcionalidades Principais**:
  - Agendamento online 24/7 com link personalizado (`boramarka.com.br/book/:token`).
  - Cobrança de sinal Pix no agendamento (reduzindo no-shows a praticamente 0%).
  - Gestão de múltiplos profissionais, cadeiras e comissões automáticas.
  - Sincronização bidirecional em tempo real com o **Google Agenda**.
  - Lembretes automáticos via WhatsApp e Web Push Notification.
- **Planos Comerciais**:
  - *Plano Essencial*: R$ 39,90/mês
  - *Plano Pro*: R$ 59,90/mês
  - *Plano Studio VIP*: R$ 89,90/mês

### 2.2. 🧁 BoraEnkomenda — Sistema Operacional para Produção & Encomendas
- **Público-Alvo**: Confeitarias, docerias, ateliês artesanais, buffets, salgadeiros e produtores sob encomenda.
- **Funcionalidades Principais**:
  - Cardápio digital na bio com personalização de recheios, massas, tamanhos e adicionais.
  - Cobrança de entrada/sinal Pix (ex.: 50% antecipado) com restante automático na entrega.
  - **Kanban de Produção**: Etapas automáticas (*Novo*, *Confirmado*, *Em Produção*, *Pronto*, *Entregue*).
  - **Ficha Técnica de Produção (BOM)**: Associação de insumos por produto, apuração de custo e margem bruta, e baixa automática de estoque.
  - **Custo Médio Ponderado (CMP)**: Recálculo contábil contínuo em cada entrada de mercadoria.
  - **Comanda de Produção & Preparo**: Impressão direta de comanda para bancada/cozinha com checklist e detalhes de entrega.
  - **CRM de Encomendas & LTV**: Ranking de clientes mais valiosos, histórico de compras, ticket médio e canal direto via WhatsApp.
  - **Meta de Faturamento Mensal**: Definição e acompanhamento de metas com barra de progresso em tempo real.
  - **Lista Inteligente de Compras**: Agrupamento automático de insumos necessários por período para compras em atacado/supermercado.
  - **Devoluções & Trocas**: Gestão de estornos com reposição de estoque e conciliação financeira automática.
  - Emissão e entrada de Notas Fiscais (NFC-e / NF-e) com atualização automática do estoque.
- **Planos Comerciais**:
  - *Plano Ateliê*: R$ 39,90/mês
  - *Plano Confeitaria Pro*: R$ 69,90/mês
  - *Plano Gourmet VIP*: R$ 99,90/mês

---

## 3. Arquitetura e Topologia do Sistema

```mermaid
graph TB
    subgraph Camada de Clientes (Frontend)
        ClientShop["Vitrine Pública & PWA (:username/loja ou /book/:token)"]
        MerchantDash["Dashboard Executivo do Lojista (/dashboard)"]
        SuperPortal["Portal Operacional SuperAdmin (/superadmin)"]
    end

    subgraph Roteamento & Segurança (Edge)
        ReverseProxy["Edge Nginx / Cloudflare CDN"]
        SSLTermination["TLS 1.3 / HSTS / CORS"]
    end

    subgraph Servidor de Aplicação (Backend)
        FastifyApp["Cluster Fastify 4 (TypeScript)"]
        AuthGuard["JWT Engine + RBAC Guard"]
        PixEngine["Motor EMVCo QRCPS-MPM CRC16"]
        FiscalEngine["Motor Fiscal SEFAZ XML Parser"]
        NotificationEngine["Disparador WhatsApp + Web Push"]
    end

    subgraph Persistência & Integrações
        PostgresDB[("PostgreSQL 17 + Prisma ORM")]
        MercadoPago["API Mercado Pago Checkout"]
        WhatsAppAPI["WhatsApp Webhook & API Gateway"]
    end

    ClientShop --> ReverseProxy
    MerchantDash --> ReverseProxy
    SuperPortal --> ReverseProxy

    ReverseProxy --> SSLTermination
    SSLTermination --> FastifyApp

    FastifyApp --> AuthGuard
    FastifyApp --> PixEngine
    FastifyApp --> FiscalEngine
    FastifyApp --> NotificationEngine

    FastifyApp --> PostgresDB
    PixEngine --> MercadoPago
    NotificationEngine --> WhatsAppAPI
```

---

## 4. Módulos e Motores de Alta Performance

### 4.1. Motor de Pagamento PIX EMVCo Direto e Mercado Pago
- **Geração de Payload Estático/Dinâmico**: Implementação estrita do padrão internacional EMVCo QRCPS-MPM com checksum polinomial CRC16 (`0x1021`).
- **Zero Taxas para o Comerciante**: O valor do sinal pago pelo cliente cai instantaneamente na chave Pix do profissional sem retenção ou taxas de intermediação.
- **Split & Checkout Mercado Pago**: Suporte nativo a assinaturas recorrentes com webhooks idempotentes protegidos contra requisições duplicadas.

### 4.2. Motor Fiscal e Gestão de Estoque (NF-e, NFC-e e XML)
- **Parser Resiliente de XML e Danfe**: Extração automática de dados fiscais através de upload de arquivo XML (`nfeProc`, `infNFe`), chaves de 44 dígitos ou leitura de Danfe Simplificada.
- **Alimentação Automatizada de Estoque**: Os itens discriminados na nota de compra são associados aos insumos e produtos cadastrados, gerando movimentações de entrada e atualizando o custo médio e preço de venda.
- **Consulta CNPJ em Tempo Real**: Validação de fornecedores com consulta automática à Receita Federal via BrasilAPI.

### 4.3. Motor de Analytics e Inteligência Financeira Unificada
- **Evolução de Faturamento dos Últimos 6 Meses**: Agregação inteligente que consolida em tempo real:
  1. Transações recebidas no módulo financeiro (`Transaction`).
  2. Encomendas entregues e sinais recebidos (`Order`).
  3. Agendamentos concluídos e taxas de reserva (`Booking`).
- **Movimento por Dia da Semana**: Mapeamento do fluxo de clientes de Domingo a Sábado, identificando gargalos e horários de pico.
- **Ranking de Mais Vendidos**: Gráfico donut identificando os produtos e serviços com maior tração de receita e volume de pedidos.

### 4.4. Kanban de Produção e Listas de Compras Inteligentes
- **Workflow Visual**: Gestão completa das encomendas desde o recebimento até a entrega com cartões arrastáveis e filtros dinâmicos.
- **Geração de Lista de Compras**: Calcula automaticamente as quantidades de ingredientes necessárias para atender aos pedidos da semana, permitindo marcar itens como comprados diretamente pelo celular.

### 4.5. SuperAdmin e Gestão de Assinaturas em Tempo Real
- **Troca de Verticais em 1 Clique**: Possibilidade de alternar qualquer conta entre **BoraMarka** e **BoraEnkomenda** sem perda de integridade de dados.
- **Modo Impersonate**: Acesso administrativo instantâneo à conta do cliente para suporte, com barra de atalho no topo e badge de vertical interativo.
- **Gestão Granular de Planos**: Upgrade, downgrade e liberação de planos para qualquer cliente da base diretamente pelo painel.

---

## 5. Stack Tecnológico

| Camada | Tecnologia | Versão | Propósito |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | `18.3.1` | Biblioteca de interface reativa e performática |
| **Build & Bundler** | Vite | `5.4.1` | Ferramenta de build ultrarrápida com HMR instantâneo |
| **Linguagem** | TypeScript | `5.5.3` | Tipagem estática rigorosa em 100% do projeto |
| **Estilização** | TailwindCSS | `3.4.1` | Design system corporativo com suporte a Dark Mode |
| **Backend** | Fastify | `4.28.1` | Framework Node.js de altíssimo throughput e baixo overhead |
| **ORM** | Prisma | `5.18.0` | Modelagem e migrações tipadas para PostgreSQL |
| **Banco de Dados** | PostgreSQL | `17.x` | Banco de dados relacional ACID enterprise |
| **Testes** | Vitest | `4.1.10` | Suíte de testes unitários ultrarrápida |
| **Criptografia** | Argon2 / Bcrypt | `^3.0` | Hashing de senhas resistente a ataques de força bruta |

---

## 6. Estrutura do Código-Fonte (Monorepo)

```
BoraMarka/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Schema completo do PostgreSQL
│   ├── src/
│   │   ├── plugins/             # Autenticação JWT, CORS, Rate Limit
│   │   ├── routes/              # Endpoints Fastify (admin, analytics, billing, orders, etc.)
│   │   ├── services/            # Integrações WhatsApp, Pix, Fiscal e Auditoria
│   │   ├── utils/               # Validadores Zod, cálculo EMVCo e parser XML
│   │   └── server.ts            # Ponto de entrada do servidor backend
│   └── tests/                   # Testes unitários com Vitest
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/          # Gráficos Canvas (MiniBar, Weekday, Donut, Pie)
│   │   │   ├── dashboard/       # Abas, modais e componentes do Dashboard
│   │   │   │   ├── modals/      # Modais de Produto, Vertical, XML, Fornecedores
│   │   │   │   └── tabs/        # Visão Geral, Encomendas, Estoque, Faturamento
│   │   │   └── landing/         # Componentes da Landing Page de alta conversão
│   │   ├── pages/               # Dashboard, SuperAdmin, Landing, Reserva, Loja
│   │   ├── services/            # Cliente HTTP Axios centralizado e tipado
│   │   └── types/               # Definições de tipos TypeScript
│   └── index.html
└── README.md
```

---

## 7. Guia de Instalação e Execução Local

### Pré-requisitos
- **Node.js**: `v20.x` ou superior
- **PostgreSQL**: `v15.x` ou superior instalado localmente ou via container Docker
- **npm** ou **pnpm**

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone https://github.com/thevigillant/boramarka.git
cd boramarka

# 2. Configurar e rodar o Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# 3. Em outro terminal, configurar e rodar o Frontend
cd ../frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173` e o backend em `http://localhost:3001`.

---

## 8. Variáveis de Ambiente

### Backend (`backend/.env`)
```env
PORT=3001
DATABASE_URL="postgresql://usuario:senha@localhost:5432/boramarka?schema=public"
JWT_SECRET="sua_chave_jwt_super_secreta_minimo_32_chars"
SUPERADMIN_SECRET="sua_chave_mestra_superadmin"
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="http://localhost:3001/api"
```

---

## 9. Segurança, Auditoria e Conformidade LGPD

- **Controle de Acesso Baseado em Funções (RBAC)**: Segregação completa entre operadores de equipe, administradores de loja e equipe SuperAdmin da plataforma.
- **Trilha de Auditoria (AuditLog)**: Registro com carimbo de data/hora de operações sensíveis (exclusão de registros, alterações cadastrais, logins e transações financeiras).
- **Proteção contra Ameaças**: Sanitização de entradas com Zod, prevenção contra injeção SQL nativa pelo Prisma ORM, cabeçalhos de segurança Helmet e limitação de taxa por IP (*Rate Limiting*).

---

## 10. Licença e Propriedade Intelectual

Distribuído sob licença comercial proprietária. Todos os direitos reservados a **BoraMarka Tecnologias Digitais LTDA**. Proibida a reprodução ou distribuição sem autorização prévia expressa.
