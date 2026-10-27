import { prisma } from '@packages/db/prisma'
import { builder } from './lib/builder'

const ProductRef = builder.prismaObject('Product', {
  description: 'A Product',
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    summary: t.exposeString('summary'),
    description: t.exposeString('description'),
    price: t.exposeInt('price'),
    stockCount: t.exposeInt('stockCount'),
    imageUrl: t.exposeString('imageUrl'),
  }),
})

builder.queryField('products', (t) =>
  t.field({
    type: [ProductRef],
    description: 'List of available products.',
    resolve: async () => prisma.product.findMany(),
  })
)

builder.queryField('productById', (t) =>
  t.field({
    type: ProductRef,
    description: 'Fetch a product by id.',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, { id }) => {
      const productId = Number(id)
      if (!Number.isSafeInteger(productId)) {
        return null
      }

      return prisma.product.findUnique({
        where: { id: productId },
      })
    },
  })
)

const CheckoutInput = builder.inputType('CheckoutInput', {
  description: 'Checkout input',
  fields: (t) => ({
    id: t.id({ required: true }),
    count: t.int({ required: true }),
  }),
})

builder.mutationField('checkout', (t) =>
  t.field({
    type: [ProductRef],
    description: 'Checkout cart',
    args: {
      cart: t.arg({ type: [CheckoutInput], required: true }),
    },
    resolve: async (_parent, { cart }, ctx) => {
      const products = await prisma.product.findMany()
      const cartProductIds = new Set<number>()

      for (const { id, count } of cart) {
        const productId = Number(id)
        if (!Number.isSafeInteger(productId)) {
          continue
        }

        cartProductIds.add(productId)
        const product = products.find(
          ({ id: existingId }) => existingId === productId
        )
        if (!(product && product.stockCount >= count)) {
          continue
        }

        const stockCount = product.stockCount - count
        await prisma.product.update({
          where: { id: productId },
          data: { stockCount },
        })
        product.stockCount = stockCount
      }

      ctx.pubsub.publish(
        'productUpdates',
        products.filter(({ id }) => cartProductIds.has(id))
      )

      return products
    },
  })
)

builder.subscriptionField('productUpdates', (t) =>
  t.field({
    type: [ProductRef],
    description: 'Updates the available stock in real-time.',
    subscribe: (_parent, _args, ctx) => ctx.pubsub.subscribe('productUpdates'),
    resolve: (value) => value,
  })
)
