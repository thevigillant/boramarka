import { prisma } from '../db';

async function main() {
  // Conectar o serviço 8 (Sombrancelha) como adicional/upsell do serviço 5 (Corte Padrão)
  const upsell = await prisma.serviceUpsell.upsert({
    where: {
      mainServiceId_addonServiceId: {
        mainServiceId: 5,
        addonServiceId: 8
      }
    },
    update: {},
    create: {
      mainServiceId: 5,
      addonServiceId: 8
    }
  });

  console.log('✅ ServiceUpsell criado/vinculado:', upsell);
}

main().finally(() => prisma.$disconnect());
