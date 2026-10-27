/* eslint-disable jsdoc/require-jsdoc -- Internal sample-data helpers are self-describing. */
import type {
  Approval,
  Bid,
  BidLineItem,
  Buyer,
  Rfq,
  RfqLineItem,
  SalesEngineer,
  Supplier,
  User1,
  VehicleModel,
  VehiclePart,
} from '../../generated/prisma-client'
import { prisma } from '../prisma'

const userSeeds = [
  { email: 'buyer1@example.test', role: 'BUYER' },
  { email: 'buyer2@example.test', role: 'BUYER' },
  { email: 'buyer3@example.test', role: 'BUYER' },
  { email: 'buyer4@example.test', role: 'BUYER' },
  { email: 'buyer5@example.test', role: 'BUYER' },
  { email: 'supplier1@example.test', role: 'SUPPLIER' },
  { email: 'supplier2@example.test', role: 'SUPPLIER' },
  { email: 'supplier3@example.test', role: 'SUPPLIER' },
  { email: 'supplier4@example.test', role: 'SUPPLIER' },
  { email: 'supplier5@example.test', role: 'SUPPLIER' },
  { email: 'sales1@example.test', role: 'SALES_ENGINEER' },
  { email: 'sales2@example.test', role: 'SALES_ENGINEER' },
  { email: 'sales3@example.test', role: 'SALES_ENGINEER' },
  { email: 'sales4@example.test', role: 'SALES_ENGINEER' },
  { email: 'sales5@example.test', role: 'SALES_ENGINEER' },
] as const

const buyerSeeds = [
  { email: 'buyer1@example.test', name: 'Avery Morgan' },
  { email: 'buyer2@example.test', name: 'Jordan Lee' },
  { email: 'buyer3@example.test', name: 'Taylor Chen' },
  { email: 'buyer4@example.test', name: 'Riley Patel' },
  { email: 'buyer5@example.test', name: 'Casey Nguyen' },
] as const

const supplierSeeds = [
  {
    email: 'supplier1@example.test',
    companyName: 'Northstar Components',
    taxId: 'SEED-TAX-001',
    country: 'VIETNAM',
    complianceStatus: 'VERIFIED',
  },
  {
    email: 'supplier2@example.test',
    companyName: 'Apex Mobility Parts',
    taxId: 'SEED-TAX-002',
    country: 'INDIA',
    complianceStatus: 'VERIFIED',
  },
  {
    email: 'supplier3@example.test',
    companyName: 'Evergreen Auto Supply',
    taxId: 'SEED-TAX-003',
    country: 'CHINA',
    complianceStatus: 'PENDING',
  },
  {
    email: 'supplier4@example.test',
    companyName: 'Summit Precision Works',
    taxId: 'SEED-TAX-004',
    country: 'GLOBAL',
    complianceStatus: 'VERIFIED',
  },
  {
    email: 'supplier5@example.test',
    companyName: 'Blue River Manufacturing',
    taxId: 'SEED-TAX-005',
    country: 'VIETNAM',
    complianceStatus: 'PENDING',
  },
] as const

const salesEngineerSeeds = [
  { email: 'sales1@example.test', name: 'Morgan Ellis' },
  { email: 'sales2@example.test', name: 'Jamie Rivera' },
  { email: 'sales3@example.test', name: 'Drew Kim' },
  { email: 'sales4@example.test', name: 'Alex Okafor' },
  { email: 'sales5@example.test', name: 'Sam Wilson' },
] as const

const vehicleModelSeeds = [
  'CloudWorx City EV',
  'CloudWorx Cargo EV',
  'CloudWorx Family SUV',
  'CloudWorx Urban Van',
  'CloudWorx Utility Truck',
] as const

const vehiclePartSeeds = [
  { name: 'City EV battery pack', vehicleModelName: vehicleModelSeeds[0] },
  { name: 'City EV braking assembly', vehicleModelName: vehicleModelSeeds[0] },
  { name: 'Cargo EV chassis frame', vehicleModelName: vehicleModelSeeds[1] },
  { name: 'Cargo EV drive motor', vehicleModelName: vehicleModelSeeds[1] },
  { name: 'Family SUV seat assembly', vehicleModelName: vehicleModelSeeds[2] },
  { name: 'Family SUV suspension kit', vehicleModelName: vehicleModelSeeds[2] },
  {
    name: 'Urban Van dashboard module',
    vehicleModelName: vehicleModelSeeds[3],
  },
  {
    name: 'Urban Van sliding door set',
    vehicleModelName: vehicleModelSeeds[3],
  },
  {
    name: 'Utility Truck axle assembly',
    vehicleModelName: vehicleModelSeeds[4],
  },
  { name: 'Utility Truck cargo bed', vehicleModelName: vehicleModelSeeds[4] },
] as const

const rfqSeeds = [
  {
    title: 'Sample RFQ - EV platform components',
    description: 'Sample sourcing request for City EV and cargo EV components.',
    buyerEmail: 'buyer1@example.test',
    bidClosingDate: new Date('2027-01-15T17:00:00.000Z'),
    deliveryDeadline: new Date('2027-04-30T17:00:00.000Z'),
  },
  {
    title: 'Sample RFQ - fleet body and utility components',
    description:
      'Sample sourcing request for van and utility vehicle components.',
    buyerEmail: 'buyer2@example.test',
    bidClosingDate: new Date('2027-02-15T17:00:00.000Z'),
    deliveryDeadline: new Date('2027-06-30T17:00:00.000Z'),
  },
] as const

function requireRecord<T>(record: T | undefined, description: string): T {
  if (record === undefined) {
    throw new Error(`Could not find ${description} while creating seed data.`)
  }

  return record
}

async function seedUser1(): Promise<User1[]> {
  return Promise.all(
    userSeeds.map(({ email, role }) =>
      prisma.user1.upsert({
        where: { email },
        update: { role },
        create: {
          email,
          role,
          passwordHash: 'seed-only-placeholder-not-a-login-credential',
        },
      })
    )
  )
}

async function seedBuyer(users: User1[]): Promise<Buyer[]> {
  return Promise.all(
    buyerSeeds.map(({ email, name }) => {
      const user = requireRecord(
        users.find((candidate) => candidate.email === email),
        `user ${email}`
      )

      return prisma.buyer.upsert({
        where: { userId: user.id },
        update: { name },
        create: { userId: user.id, name },
      })
    })
  )
}

async function seedSupplier(users: User1[]): Promise<Supplier[]> {
  return Promise.all(
    supplierSeeds.map(
      ({ email, companyName, taxId, country, complianceStatus }) => {
        const user = requireRecord(
          users.find((candidate) => candidate.email === email),
          `user ${email}`
        )

        return prisma.supplier.upsert({
          where: { userId: user.id },
          update: { companyName, taxId, country, complianceStatus },
          create: {
            userId: user.id,
            companyName,
            taxId,
            country,
            complianceStatus,
          },
        })
      }
    )
  )
}

async function seedSalesEngineer(users: User1[]): Promise<SalesEngineer[]> {
  return Promise.all(
    salesEngineerSeeds.map(({ email, name }) => {
      const user = requireRecord(
        users.find((candidate) => candidate.email === email),
        `user ${email}`
      )

      return prisma.salesEngineer.upsert({
        where: { userId: user.id },
        update: { name },
        create: { userId: user.id, name },
      })
    })
  )
}

async function seedVehicleModel(): Promise<VehicleModel[]> {
  return Promise.all(
    vehicleModelSeeds.map((name) =>
      prisma.vehicleModel.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )
}

async function seedVehiclePart(models: VehicleModel[]): Promise<VehiclePart[]> {
  return Promise.all(
    vehiclePartSeeds.map(({ name, vehicleModelName }) => {
      const vehicleModel = requireRecord(
        models.find((model) => model.name === vehicleModelName),
        `vehicle model ${vehicleModelName}`
      )

      return prisma.vehiclePart.upsert({
        where: { name },
        update: { vehicleModelId: vehicleModel.id },
        create: { name, vehicleModelId: vehicleModel.id },
      })
    })
  )
}

async function seedRfq(buyers: Buyer[]): Promise<Rfq[]> {
  const rfqs: Rfq[] = []

  for (const {
    title,
    description,
    buyerEmail,
    bidClosingDate,
    deliveryDeadline,
  } of rfqSeeds) {
    const buyerSeed = requireRecord(
      buyerSeeds.find((candidate) => candidate.email === buyerEmail),
      `buyer seed ${buyerEmail}`
    )
    const buyer = requireRecord(
      buyers[buyerSeeds.indexOf(buyerSeed)],
      `buyer ${buyerEmail}`
    )
    const existing = await prisma.rfq.findFirst({ where: { title } })
    const data = {
      title,
      description,
      status: 'OPEN' as const,
      buyerId: buyer.id,
      bidClosingDate,
      deliveryDeadline,
    }

    rfqs.push(
      existing
        ? await prisma.rfq.update({ where: { id: existing.id }, data })
        : await prisma.rfq.create({ data })
    )
  }

  return rfqs
}

async function seedRfqLineItem(
  rfqs: Rfq[],
  parts: VehiclePart[]
): Promise<RfqLineItem[]> {
  const rfqIds = rfqs.map(({ id }) => id)
  const oldLineItems = await prisma.rfqLineItem.findMany({
    where: { rfqId: { in: rfqIds } },
    select: { id: true },
  })
  const oldBids = await prisma.bid.findMany({
    where: { rfqId: { in: rfqIds } },
    select: { id: true },
  })

  await prisma.bidLineItem.deleteMany({
    where: {
      OR: [
        { bidId: { in: oldBids.map(({ id }) => id) } },
        { rfqLineItemId: { in: oldLineItems.map(({ id }) => id) } },
      ],
    },
  })
  await prisma.bid.deleteMany({ where: { rfqId: { in: rfqIds } } })
  await prisma.approval.deleteMany({ where: { rfqId: { in: rfqIds } } })
  await prisma.rfqLineItem.deleteMany({ where: { rfqId: { in: rfqIds } } })

  const lineItemSeeds = [
    {
      rfqTitle: rfqSeeds[0].title,
      partName: vehiclePartSeeds[0].name,
      quantity: 120,
    },
    {
      rfqTitle: rfqSeeds[0].title,
      partName: vehiclePartSeeds[1].name,
      quantity: 240,
    },
    {
      rfqTitle: rfqSeeds[0].title,
      partName: vehiclePartSeeds[2].name,
      quantity: 80,
    },
    {
      rfqTitle: rfqSeeds[1].title,
      partName: vehiclePartSeeds[6].name,
      quantity: 100,
    },
    {
      rfqTitle: rfqSeeds[1].title,
      partName: vehiclePartSeeds[7].name,
      quantity: 200,
    },
    {
      rfqTitle: rfqSeeds[1].title,
      partName: vehiclePartSeeds[8].name,
      quantity: 60,
    },
  ] as const

  return Promise.all(
    lineItemSeeds.map(({ rfqTitle, partName, quantity }) => {
      const rfq = requireRecord(
        rfqs.find((candidate) => candidate.title === rfqTitle),
        `RFQ ${rfqTitle}`
      )
      const part = requireRecord(
        parts.find((candidate) => candidate.name === partName),
        `vehicle part ${partName}`
      )

      return prisma.rfqLineItem.create({
        data: { rfqId: rfq.id, partId: part.id, quantity },
      })
    })
  )
}

async function seedBid(rfqs: Rfq[], suppliers: Supplier[]): Promise<Bid[]> {
  const bidSeeds = [
    { rfqTitle: rfqSeeds[0].title, supplierIndexes: [0, 1, 2] },
    { rfqTitle: rfqSeeds[1].title, supplierIndexes: [2, 3, 4] },
  ] as const
  const bids: Bid[] = []

  for (const { rfqTitle, supplierIndexes } of bidSeeds) {
    const rfq = requireRecord(
      rfqs.find((candidate) => candidate.title === rfqTitle),
      `RFQ ${rfqTitle}`
    )

    for (const supplierIndex of supplierIndexes) {
      const supplier = requireRecord(
        suppliers[supplierIndex],
        `supplier ${supplierIndex + 1}`
      )

      bids.push(
        await prisma.bid.upsert({
          where: {
            rfqId_supplierId: { rfqId: rfq.id, supplierId: supplier.id },
          },
          update: {
            technicalNotes: `Sample technical proposal from ${supplier.companyName}.`,
          },
          create: {
            rfqId: rfq.id,
            supplierId: supplier.id,
            technicalNotes: `Sample technical proposal from ${supplier.companyName}.`,
          },
        })
      )
    }
  }

  return bids
}

type BidLineSeed = {
  rfqId: number
  bidId: number
  rfqLineItemId: number
  leadTimeWeeks: number
  totalAmount: number
  technicalNotes: string
}

function createBidLineSeeds(
  rfqs: Rfq[],
  lineItems: RfqLineItem[],
  bids: Bid[],
  suppliers: Supplier[]
): BidLineSeed[] {
  const suppliersByRfqAndLine = [
    [
      [0, 1],
      [0, 1, 2],
      [1, 2],
    ],
    [
      [2, 3, 4],
      [2, 4],
      [3, 4],
    ],
  ] as const
  const lineSeeds: BidLineSeed[] = []

  rfqs.forEach((rfq, rfqIndex) => {
    const rfqLineItems = lineItems.filter(
      (lineItem) => lineItem.rfqId === rfq.id
    )

    rfqLineItems.forEach((lineItem, lineIndex) => {
      const supplierIndexes = requireRecord(
        suppliersByRfqAndLine[rfqIndex]?.[lineIndex],
        `supplier assignments for RFQ ${rfq.title}, line ${lineIndex + 1}`
      )

      supplierIndexes.forEach((supplierIndex, bidLineIndex) => {
        const supplier = requireRecord(
          suppliers[supplierIndex],
          `supplier ${supplierIndex + 1}`
        )
        const bid = requireRecord(
          bids.find(
            (candidate) =>
              candidate.rfqId === rfq.id && candidate.supplierId === supplier.id
          ),
          'bid for sample RFQ and supplier'
        )
        lineSeeds.push({
          rfqId: rfq.id,
          bidId: bid.id,
          rfqLineItemId: lineItem.id,
          leadTimeWeeks: 5 + supplierIndex + bidLineIndex,
          totalAmount: 12500 + lineIndex * 2750 + supplierIndex * 900,
          technicalNotes: `Sample quote option ${bidLineIndex + 1}.`,
        })
      })
    })
  })

  return lineSeeds
}

async function seedApproval(bidLineSeeds: BidLineSeed[]): Promise<Approval[]> {
  const selectedApprovals = new Map<number, number>()

  for (const rfqId of new Set(bidLineSeeds.map(({ rfqId }) => rfqId))) {
    const indices = bidLineSeeds.flatMap((seed, index) =>
      seed.rfqId === rfqId ? [index] : []
    )
    const selectedIndex = requireRecord(
      indices[Math.floor(Math.random() * indices.length)],
      `bid line for RFQ ${rfqId}`
    )
    selectedApprovals.set(rfqId, selectedIndex)
  }

  return Promise.all(
    bidLineSeeds.map((seed, index) =>
      prisma.approval.create({
        data: {
          rfqId: seed.rfqId,
          decision: selectedApprovals.get(seed.rfqId) === index,
          justification:
            selectedApprovals.get(seed.rfqId) === index
              ? 'Selected as a sample approved bid.'
              : 'Sample bid not selected for award.',
        },
      })
    )
  )
}

async function seedBidLineItem(
  bidLineSeeds: BidLineSeed[],
  approvals: Approval[]
): Promise<BidLineItem[]> {
  return Promise.all(
    bidLineSeeds.map((seed, index) => {
      const approval = requireRecord(
        approvals[index],
        `approval for bid line ${index + 1}`
      )

      return prisma.bidLineItem.create({
        data: {
          leadTimeWeeks: seed.leadTimeWeeks,
          totalAmount: seed.totalAmount,
          technicalNotes: seed.technicalNotes,
          bidId: seed.bidId,
          rfqLineItemId: seed.rfqLineItemId,
          approvalId: approval.id,
        },
      })
    })
  )
}

export async function seed1(): Promise<void> {
  const users = await seedUser1()
  const [buyers, suppliers] = await Promise.all([
    seedBuyer(users),
    seedSupplier(users),
  ])
  await seedSalesEngineer(users)

  const models = await seedVehicleModel()
  const parts = await seedVehiclePart(models)
  const rfqs = await seedRfq(buyers)
  const lineItems = await seedRfqLineItem(rfqs, parts)
  const bids = await seedBid(rfqs, suppliers)
  const bidLineSeeds = createBidLineSeeds(rfqs, lineItems, bids, suppliers)
  const approvals = await seedApproval(bidLineSeeds)
  await seedBidLineItem(bidLineSeeds, approvals)
}
