import { sendEmailVerificationCode } from '../utils/mailer';

async function main() {
  const targetEmail = process.argv[2] || process.env.SMTP_USER || 'teste@boramarka.com.br';
  console.log(`\n🚀 [TESTE DE E-MAIL] Tentando enviar e-mail de teste para: ${targetEmail}`);
  console.log(`📌 SMTP Configurado: Host=${process.env.SMTP_HOST || '(não definido)'}, Port=${process.env.SMTP_PORT || '587'}, User=${process.env.SMTP_USER || '(não definido)'}\n`);

  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const success = await sendEmailVerificationCode(targetEmail, 'Desenvolvedor', code);

  if (success) {
    console.log(`\n✅ E-mail enviado com sucesso! Verifique a caixa de entrada (e pasta de spam) de ${targetEmail}. Código enviado: ${code}\n`);
  } else {
    console.log(`\n❌ Falha ao enviar o e-mail. Verifique se as credenciais SMTP no arquivo .env (ou no Railway) estão corretas.\n`);
  }
}

main();
