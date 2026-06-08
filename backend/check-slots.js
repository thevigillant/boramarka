const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const token = '09bf2d9e-c780-4fc7-ae1d-2e1f1b5a8645';
  const link = await prisma.schedulingLink.findUnique({
    where: { token },
    include: { _count: { select: { timeSlots: true } } }
  });
  console.log('Link:', link);
  const slots = await prisma.timeSlot.findMany({
    where: { link: { token } }
  });
  console.log('Total Slots:', slots.length);
  console.log('Available Slots:', slots.filter(s => s.isAvailable).length);
}

check().finally(() => prisma.$disconnect());
