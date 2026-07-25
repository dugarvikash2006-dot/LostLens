import 'dotenv/config'
import { PrismaClient, ReportType, Category, ReportStatus, MatchStatus } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set.')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// Development-only placeholder. This is NOT a real bcrypt hash and cannot
// be used to authenticate — password hashing is implemented in a later
// phase. It exists only so the schema's non-null passwordHash is satisfied.
const DEV_PLACEHOLDER_PASSWORD_HASH = 'DEV_PLACEHOLDER_NOT_A_REAL_HASH'

async function main() {
  console.log('Seeding development data...')

  // ---- Users ----------------------------------------------------------
  const asha = await prisma.user.upsert({
    where: { email: 'asha.mehta@example.dev' },
    update: {},
    create: {
      fullName: 'Asha Mehta',
      email: 'asha.mehta@example.dev',
      passwordHash: DEV_PLACEHOLDER_PASSWORD_HASH,
    },
  })

  const rahul = await prisma.user.upsert({
    where: { email: 'rahul.verma@example.dev' },
    update: {},
    create: {
      fullName: 'Rahul Verma',
      email: 'rahul.verma@example.dev',
      passwordHash: DEV_PLACEHOLDER_PASSWORD_HASH,
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@lostlens.dev' },
    update: {},
    create: {
      fullName: 'LostLens Admin',
      email: 'admin@lostlens.dev',
      passwordHash: DEV_PLACEHOLDER_PASSWORD_HASH,
      role: 'ADMIN',
    },
  })

  // ---- Item Reports -----------------------------------------------------
  const lostBottle = await prisma.itemReport.create({
    data: {
      userId: rahul.id,
      reportType: ReportType.LOST,
      itemName: 'Blue Water Bottle',
      category: Category.OTHER,
      color: 'Blue',
      description: 'Stainless steel bottle with a dented cap, university logo sticker.',
      eventDate: new Date('2026-07-02'),
      approximateTime: 'Around 4 PM',
      location: 'Sports Complex',
      status: ReportStatus.POTENTIAL_MATCH,
    },
  })

  const foundBottle = await prisma.itemReport.create({
    data: {
      userId: asha.id,
      reportType: ReportType.FOUND,
      itemName: 'Blue Water Bottle',
      category: Category.OTHER,
      color: 'Blue',
      description: 'Steel bottle found near the sports complex entrance, dented cap.',
      eventDate: new Date('2026-07-03'),
      location: 'Near Sports Complex',
      status: ReportStatus.POTENTIAL_MATCH,
    },
  })

  await prisma.itemReport.create({
    data: {
      userId: rahul.id,
      reportType: ReportType.LOST,
      itemName: 'Laptop Charger',
      category: Category.ELECTRONICS,
      brand: 'Dell',
      description: '65W charger, black cable with a small tear near the plug.',
      eventDate: new Date('2026-06-29'),
      location: 'Room B-204',
      status: ReportStatus.OPEN,
    },
  })

  await prisma.itemReport.create({
    data: {
      userId: asha.id,
      reportType: ReportType.FOUND,
      itemName: 'Student ID Card',
      category: Category.DOCUMENTS,
      description: 'Found on a cafeteria table, no case.',
      eventDate: new Date('2026-07-01'),
      location: 'Cafeteria',
      status: ReportStatus.OPEN,
    },
  })

  await prisma.itemReport.create({
    data: {
      userId: rahul.id,
      reportType: ReportType.LOST,
      itemName: 'Silver Keychain',
      category: Category.KEYS,
      description: 'Small keychain with three keys and a bottle-opener charm.',
      eventDate: new Date('2026-06-27'),
      location: 'Parking Lot',
      status: ReportStatus.OPEN,
    },
  })

  // ---- Sample Match -------------------------------------------------------
  // Mock scores only — no matching algorithm runs in this phase.
  await prisma.match.upsert({
    where: {
      lostItemId_foundItemId: {
        lostItemId: lostBottle.id,
        foundItemId: foundBottle.id,
      },
    },
    update: {},
    create: {
      lostItemId: lostBottle.id,
      foundItemId: foundBottle.id,
      overallScore: 91.0,
      imageScore: 92.0,
      descriptionScore: 85.0,
      categoryScore: 90.0,
      locationScore: 90.0,
      dateScore: 88.0,
      status: MatchStatus.SUGGESTED,
      explanation: 'Sample development match — scores are mock data, not AI-generated.',
    },
  })

  console.log('Seeding complete.')
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
