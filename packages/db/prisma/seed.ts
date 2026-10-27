/**
 * @packageDocumentation
 * {@inheritDoc seed}
 */
import { logger } from '@packages/logger'
import { prisma } from './prisma'
import { seed1 } from './seed-logics.ts/seed1'

async function seedProducts() {
  // Start from an empty table so you can run this file more than once.
  await prisma.product.deleteMany({})

  // Write: insert one row.
  const newProducts = await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Headphones',
        summary: 'Noise-cancelling over-ear headphones.',
        description:
          'Experience premium sound quality with active noise cancellation and 30-hour battery life.',
        price: 199,
        stockCount: 45,
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300',
      },
      {
        name: 'Smart Watch',
        summary: 'Fitness tracker and smartwatch.',
        description:
          'Track your workouts, heart rate, and sleep with this sleek waterproof smartwatch.',
        price: 249,
        stockCount: 12,
        imageUrl:
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300',
      },
      {
        name: 'Mechanical Keyboard',
        summary: 'RGB backlit mechanical keyboard.',
        description:
          'High-performance backlit switches for a smooth typing experience.',
        price: 89,
        stockCount: 0,
        imageUrl:
          'https://images.unsplash.com/photo-1636352709172-ca33daf4daec?w=400&h=300',
      },
      {
        name: 'Bluetooth Speaker',
        summary: 'Portable waterproof speaker.',
        description:
          'Deep bass and crystal clear sound with 20-hour playtime and IPX7 rating.',
        price: 59,
        stockCount: 25,
        imageUrl:
          'https://images.unsplash.com/photo-1643385958950-8f0b8852171a?w=400&h=300',
      },
      {
        name: 'Ergonomic Mouse',
        summary: 'Wireless mouse for comfort.',
        description:
          'Reduce wrist strain with this vertical ergonomic wireless mouse.',
        price: 49,
        stockCount: 18,
        imageUrl:
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300',
      },
      {
        name: 'Laptop Stand',
        summary: 'Adjustable aluminum stand.',
        description:
          'Elevate your laptop to eye level for better posture and cooling.',
        price: 35,
        stockCount: 60,
        imageUrl:
          'https://images.unsplash.com/photo-1629317480826-910f729d1709?w=400&h=300',
      },
    ],
  })
  logger.info('Created: ', newProducts)
}

async function main() {
  await seedProducts()
  await seed1()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
