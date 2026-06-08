import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const existingAdmin = await prisma.admin.findFirst();
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: {
        username: 'admin',
        passwordHash,
      },
    });
    console.log('✅ Admin criado com sucesso!');
    console.log('   Usuário: admin');
    console.log('   Senha: admin123');
    console.log('   ⚠️  Altere a senha em produção!');
  } else {
    console.log('ℹ️  Admin já existe, seed ignorado.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
