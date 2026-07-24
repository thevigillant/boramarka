import { prisma } from '../db';

async function main() {
  const services = await prisma.service.findMany({
    include: {
      mainUpsells: {
        include: {
          addonService: true
        }
      }
    }
  });
  console.log('--- SERVICOS CADASTRADOS ---');
  console.dir(services, { depth: null });

  const links = await prisma.schedulingLink.findMany({
    include: {
      service: true
    }
  });
  console.log('--- LINKS CADASTRADOS ---');
  console.dir(links, { depth: null });
}

main().finally(() => prisma.$disconnect());
