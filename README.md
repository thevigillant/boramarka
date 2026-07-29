# 🚀 BoraMarka — Plataforma SaaS de Agendamento Online & Gestão Inteligente

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em_Produção-emerald?style=for-the-badge&logo=vercel" alt="Status">
  <img src="https://img.shields.io/badge/PWA-Instalável_Android%2FiOS-ec4899?style=for-the-badge&logo=pwa" alt="PWA">
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Backend-Fastify_v4_%2B_TypeScript-000000?style=for-the-badge&logo=fastify" alt="Fastify">
  <img src="https://img.shields.io/badge/Database-Prisma_5_%2B_PostgreSQL-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
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

A plataforma reúne em um único ecossistema: **Agendamento Online 24/7**, **Central de Suporte & Chat de Ajuda em Tempo Real**, **Cobrança de Sinal Antecipado via Mercado Pago**, **Login de Colaboradores por Empresa**, **Módulo de RH & Equipe**, **Cartão Fidelidade Digital & Cupons**, **Onboarding Inteligente por Nicho**, **Gerador de Bio do Instagram**, **Notificações Automáticas via WhatsApp & Web Push**, **Fluxo de Caixa com Exportação em PDF/Excel** e **Monitoramento de Consumo do Banco de Dados**.

---

## 💎 Destaques & Funcionalidades Principais

### 👔 Login de Colaborador & Identificação por Empresa
- **Acesso em 2 Modalidades:** Alternância entre **Gestor / Empresa** (usuário principal da empresa) e **Colaborador / Equipe** (Identificador da Empresa + Nome do Operador + Senha).
- **Validação de Credenciais em 3 Vias:** O backend valida o identificador da empresa (`companyUsername`) atrelado ao nome do operador (`operatorUsername`), impedindo acessos indevidos.

### 💬 Chat de Ajuda Flutuante
- Widget flutuante em glassmorphism no canto inferior direito para os clientes enviarem dúvidas e mensagens direto para a equipe de suporte.

### 📊 Gestão de Consumo & Armazenamento de Banco de Dados
- Acompanhamento em tempo real do uso do banco de dados (tamanho em MB, registros de agendamentos, clientes salvos e uploads de mídia).

### 🎨 Design System Executive Premium (Light & Dark Mode)
- Interface limpa com suporte completo a Modo Escuro (`.dark`) e Modo Claro (`.light`) com contraste alto e ícones vetoriais em SVG (Lucide React).

### 🎁 Cartão Fidelidade Digital & Cupons Automáticos
- Contabilização automática de selos (`LoyaltyCard`) a cada atendimento concluído pelo profissional.

### 💳 Cobrança de Sinal Antecipado & Checkout Mercado Pago
- Clientes pagam taxa de sinal ou valor integral via PIX / Cartão no agendamento, creditado direto no Mercado Pago do profissional.

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
| **ORM** | Prisma ORM 5.x | Modelagem e migrations com suporte a SQLite (Dev) e PostgreSQL (Prod) |
| **Banco de Dados** | SQLite / PostgreSQL | Banco de dados relacional com relatórios otimizados |
| **Gateway de Pagamento** | Mercado Pago API v1 | Processamento de cobranças PIX, Cartão e Refunds |
| **E-mail Transacional** | Nodemailer (Gmail SSL 465) | Envio de códigos de verificação |

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

## 📄 Licença

Este projeto é um software proprietário mantido por **BoraMarka** (Bruno Santana Reis). Todos os direitos reservados.
