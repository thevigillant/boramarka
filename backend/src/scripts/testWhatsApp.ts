import { sendWhatsAppMessage, getWhatsAppStatus, formatPhoneForWhatsApp } from '../services/whatsapp';

async function main() {
  console.log('🧪 Testando Serviço de WhatsApp Real BoraMarka...\n');

  const status = getWhatsAppStatus();
  console.log('📋 Status da Configuração:');
  console.log(`   Configurado: ${status.isConfigured ? 'SIM ✅' : 'NÃO (Modo Fallback wa.me) 🟡'}`);
  console.log(`   Provedor Ativo: ${status.provider.toUpperCase()}`);
  console.log(`   Detalhes: ${status.details}\n`);

  const testPhone = '11999999999';
  const formatted = formatPhoneForWhatsApp(testPhone);
  console.log(`📱 Formatação de Telefone: "${testPhone}" -> "${formatted}"`);

  console.log('\n🚀 Executando teste de envio de mensagem...');
  const result = await sendWhatsAppMessage(
    testPhone,
    '🚀 *BoraMarka Teste de Integração Real*\n\nMensagem de teste enviada com sucesso!'
  );

  console.log('📊 Resultado do Teste:');
  console.log(`   Sucesso: ${result.success}`);
  console.log(`   Método: ${result.method.toUpperCase()}`);
  if (result.link) {
    console.log(`   Link Fallback: ${result.link}`);
  }
  if (result.error) {
    console.log(`   Erro: ${result.error}`);
  }

  console.log('\n✅ Teste finalizado com sucesso!');
}

main().catch(err => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
