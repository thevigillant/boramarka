/**
 * Assistente Virtual Inteligente do Helpdesk BoraMarka
 * Responde automaticamente dúvidas de lojistas e administradores em tempo real.
 */

interface BotResponse {
  answer: string;
  categorySuggestion?: string;
}

export function generateHelpdeskAutoReply(query: string, subject: string = '', category: string = ''): BotResponse {
  const fullText = `${subject} ${query}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. PIX / DADOS DE RECEBIMENTO
  if (
    fullText.includes('pix') ||
    fullText.includes('receber') ||
    fullText.includes('chave pix') ||
    fullText.includes('cadastrar pix') ||
    fullText.includes('cadastra meu pix') ||
    fullText.includes('chave')
  ) {
    return {
      categorySuggestion: 'FINANCEIRO',
      answer: `Olá! Para cadastrar sua **Chave Pix** e receber o valor dos agendamentos diretamente na sua conta:

1️⃣ No menu lateral do BoraMarka, acesse a aba **Configurações**.
2️⃣ Role até a seção de **Pagamentos & Chave Pix**.
3️⃣ No campo **Chave Pix**, digite sua chave (pode ser CPF, CNPJ, E-mail, Celular ou Chave Aleatória).
4️⃣ *(Opcional)* Se você quer receber por Pix Automático com baixa imediata, clique em **Configurar Mercado Pago** e cole seu Access Token.
5️⃣ Clique no botão **Salvar Alterações** no final da página!

✅ Pronto! A partir de agora, seus clientes verão sua chave Pix e o QR Code automaticamente ao realizarem um agendamento.`,
    };
  }

  // 2. MERCADO PAGO / TOKEN / SINAL
  if (
    fullText.includes('mercado pago') ||
    fullText.includes('mercadopago') ||
    fullText.includes('token') ||
    fullText.includes('sinal') ||
    fullText.includes('taxa de reserva')
  ) {
    return {
      categorySuggestion: 'FINANCEIRO',
      answer: `Para ativar a cobrança automática e receber via **Mercado Pago**:

1️⃣ Acesse **Configurações** no menu lateral.
2️⃣ Clique no botão **Configurar Mercado Pago**.
3️⃣ Acesse o site do [Mercado Pago Developers](https://www.mercadopago.com.br/developers) com a sua conta.
4️⃣ Vá em **Suas Aplicações** > **Credenciais de Produção** e copie o **Access Token** (começa com \`APP_USR-...\`).
5️⃣ Cole o token no BoraMarka e salve.

💡 **Dica**: Para cobrar sinal antecipado, vá na aba **Links de Agendamento**, edite seu link e marque **Cobrar Taxa de Reserva** com o valor desejado!`,
    };
  }

  // 3. SERVIÇOS / PREÇOS / ADICIONAIS
  if (
    fullText.includes('servico') ||
    fullText.includes('preco') ||
    fullText.includes('adicional') ||
    fullText.includes('upsell') ||
    fullText.includes('duracao') ||
    fullText.includes('cadastrar servico')
  ) {
    return {
      categorySuggestion: 'DUVIDA',
      answer: `Para criar ou editar seus **Serviços**:

1️⃣ Acesse a aba **Serviços** no menu lateral.
2️⃣ Clique no botão **+ Novo Serviço**.
3️⃣ Preencha o **Nome do Serviço**, **Preço (R$)** e o tempo de **Duração (minutos)**.
4️⃣ *(Opcional)* Em **Serviços Adicionais (Upsell)**, você pode selecionar outros serviços que o cliente pode adicionar com 1 clique durante a reserva (ex: Lavagem especial, Barba, Hidratação).
5️⃣ Clique em **Salvar Serviço**. O link público do serviço é gerado automaticamente!`,
    };
  }

  // 4. LINKS / HORÁRIOS / DISPONIBILIDADE
  if (
    fullText.includes('link') ||
    fullText.includes('horario') ||
    fullText.includes('agenda') ||
    fullText.includes('disponibilidade') ||
    fullText.includes('abrir vaga') ||
    fullText.includes('slot')
  ) {
    return {
      categorySuggestion: 'DUVIDA',
      answer: `Para gerenciar seus **Horários e Links de Agendamento**:

1️⃣ Acesse a aba **Links** no painel do BoraMarka.
2️⃣ Clique no botão **+ Novo Link** para criar uma agenda com horários semanais ou personalizados.
3️⃣ Escolha os dias da semana e a faixa de horários de atendimento (ex: 08:00 às 19:00 com intervalo de 30 min).
4️⃣ Você pode copiar o link do seu link ou compartilhar seu **Perfil Público Geral** (\`boramarka.com.br/seu-usuario\`) direto na bio do seu Instagram ou WhatsApp!`,
    };
  }

  // 5. CANCELAMENTO / REAGENDAMENTO
  if (
    fullText.includes('cancelar') ||
    fullText.includes('cancelamento') ||
    fullText.includes('reagendar') ||
    fullText.includes('codigo') ||
    fullText.includes('reembolso')
  ) {
    return {
      categorySuggestion: 'DUVIDA',
      answer: `Sobre **Cancelamento e Gerenciamento de Reservas**:

• **Pelo seu Painel**: Na aba **Agendamentos**, localize o agendamento desejado, clique nele e altere o status para **CANCELADO**.
• **Pelo Cliente**: Ao agendar, o cliente recebe um **Código de 6 dígitos** no comprovante dele. Ele pode acessar o link de cancelamento no comprovante e liberar a vaga sozinho.
• **Reembolsos**: Se a taxa foi paga pelo Mercado Pago, o reembolso pode ser acionado direto no comprovante do cliente caso esteja dentro do prazo.`,
    };
  }

  // 6. WHATSAPP / LEMBRETES AUTOMÁTICOS
  if (
    fullText.includes('whatsapp') ||
    fullText.includes('lembrete') ||
    fullText.includes('notificacao') ||
    fullText.includes('avisar') ||
    fullText.includes('mensagem')
  ) {
    return {
      categorySuggestion: 'TECNICO',
      answer: `Para configurar os **Lembretes Automáticos via WhatsApp**:

1️⃣ Acesse **Configurações** no menu lateral.
2️⃣ Na seção **Lembretes Automáticos**, marque a opção **Ativar Lembretes**.
3️⃣ Selecione o tempo de antecedência desejado (por padrão enviamos com 24 horas e 2 horas antes do horário).
4️⃣ O BoraMarka cuidará de notificar seus clientes automaticamente para evitar faltas e esquecimentos!`,
    };
  }

  // 7. PROGRAMA DE FIDELIDADE
  if (
    fullText.includes('fidelidade') ||
    fullText.includes('selo') ||
    fullText.includes('pontos') ||
    fullText.includes('cupom') ||
    fullText.includes('desconto')
  ) {
    return {
      categorySuggestion: 'DUVIDA',
      answer: `Para usar o **Cartão Fidelidade Digital**:

1️⃣ Acesse a aba **Fidelidade** no menu lateral.
2️⃣ Configure a meta de agendamentos (ex: 10 cortes) e a recompensa (ex: 20% de desconto ou corte grátis).
3️⃣ A cada agendamento concluído, o cliente ganha 1 selo no número de telefone dele.
4️⃣ Ao completar a cartela, o BoraMarka gera automaticamente um cupom exclusivo para ele usar no próximo agendamento!`,
    };
  }

  // 8. FUNCIONÁRIOS / EQUIPE / RH
  if (
    fullText.includes('funcionario') ||
    fullText.includes('equipe') ||
    fullText.includes('colaborador') ||
    fullText.includes('ponto') ||
    fullText.includes('holerite') ||
    fullText.includes('rh')
  ) {
    return {
      categorySuggestion: 'DUVIDA',
      answer: `Para gerenciar sua equipe no **Portal do RH**:

1️⃣ Acesse a aba **Funcionários** no menu lateral.
2️⃣ Clique em **+ Novo Funcionário** e preencha o nome, cargo, percentual de comissão e horários.
3️⃣ Copie o **Link Seguro do Portal** e envie para o WhatsApp do seu colaborador.
4️⃣ Pelo celular, ele poderá bater ponto com geolocalização, ver os próprios agendamentos e assinar holerites!`,
    };
  }

  // 9. PLANOS / ASSINATURA / UPGRADE
  if (
    fullText.includes('plano') ||
    fullText.includes('assinatura') ||
    fullText.includes('mensalidade') ||
    fullText.includes('pagar') ||
    fullText.includes('upgrade') ||
    fullText.includes('trial')
  ) {
    return {
      categorySuggestion: 'FINANCEIRO',
      answer: `Sobre os **Planos e Assinatura BoraMarka**:

• **Período de Testes (Trial 7 Dias)**: Acesso livre para testar todas as funcionalidades na prática.
• **Plano Premium**: Agendamentos ilimitados, lembretes de WhatsApp, CRM de clientes, gestão de equipe e relatórios completos.
• Para assinar ou alterar seu plano, clique na sua foto de perfil no canto superior direito e acesse **Minha Assinatura**.`,
    };
  }

  // 10. RESPOSTA INTELIGENTE GERAL (FALLBACK)
  return {
    categorySuggestion: category || 'DUVIDA',
    answer: `Olá! Recebi sua mensagem: *" ${subject || query} "*

📌 **Nosso atendimento automático já registrou seu chamado.** 

Enquanto um atendente humano da equipe BoraMarka analisa os detalhes específicos do seu caso (dentro do nosso SLA prioritário de 24h a 48h), aqui estão os atalhos rápidos mais comuns para você resolver agora:

• **Configurar Chave Pix / Mercado Pago**: Menu *Configurações* > *Pagamentos*.
• **Criar ou Editar Serviços e Preços**: Menu *Serviços* > *Novo Serviço*.
• **Gerenciar Agenda e Horários**: Menu *Links de Agendamento*.
• **Suporte com Especialista**: Pode responder a esta mensagem a qualquer momento com mais detalhes ou prints anexos!`,
  };
}
