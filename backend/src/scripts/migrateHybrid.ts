import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.admin.count({
    where: { businessType: 'HYBRID' }
  })
  console.log(`Found ${count} admin(s) with businessType 'HYBRID'.`)
  if (count > 0) {
    const updated = await prisma.admin.updateMany({
      where: { businessType: 'HYBRID' },
      data: { businessType: 'PRODUCTS' }
    })
    console.log(`Successfully migrated ${updated.count} admin(s) to 'PRODUCTS' (BoraEnkomenda).`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
