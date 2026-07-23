import { prisma } from '../db';

async function updateMpToken() {
  const token = 'APP_USR-8644204768805980-060509-b10acd18d7556a8bd8dcb83374f8c7e1-718645102';
  
  const result = await prisma.admin.updateMany({
    where: {
      OR: [
        { mpAccessToken: '' },
        { mpAccessToken: 'SIMULADOR' },
        { mpAccessToken: { startsWith: 'APP_USR-5801115412995543' } }
      ]
    },
    data: {
      mpAccessToken: token
    }
  });

  console.log(`✅ Atualizados ${result.count} administradores no banco com o novo Access Token de Produção Mercado Pago.`);
}

updateMpToken().catch(console.error);
