import { sendWelcomeEmail } from '../utils/mailer';

async function run() {
  const targetEmail = 'brunoreisdesignpro@gmail.com';
  console.log(`Enviando e-mail de boas-vindas para: ${targetEmail}...`);
  const success = await sendWelcomeEmail(targetEmail, 'brunoreisdesignpro', 'Bruno Reis Design');
  if (success) {
    console.log('✅ E-mail enviado com sucesso!');
  } else {
    console.log('❌ Falha ao enviar o e-mail.');
  }
}

run();
