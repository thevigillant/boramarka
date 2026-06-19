import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const existingAdmin = await prisma.admin.findFirst({
    where: { NOT: { username: 'odonodoboramarka' } }
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        username: 'admin',
        passwordHash,
        role: 'user',
      },
    });
    console.log('✅ Admin de teste criado com sucesso!');
    console.log('   Usuário: admin');
    console.log('   Senha: admin123');
  } else {
    console.log('ℹ️  Admin de teste já existe.');
  }

  // Criar ou atualizar superadmin
  const superadminUsername = 'odonodoboramarka';
  const existingSuperadmin = await prisma.admin.findUnique({
    where: { username: superadminUsername }
  });

  if (!existingSuperadmin) {
    const passwordHash = await bcrypt.hash('300923', 10);
    await prisma.admin.create({
      data: {
        username: superadminUsername,
        passwordHash,
        role: 'superadmin',
        businessName: 'BoraMarka Admin',
      },
    });
    console.log('✅ Super Admin criado com sucesso!');
    console.log(`   Usuário: ${superadminUsername}`);
  } else {
    await prisma.admin.update({
      where: { username: superadminUsername },
      data: { role: 'superadmin' }
    });
    console.log('ℹ️  Super Admin já existe (role garantida como superadmin).');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
