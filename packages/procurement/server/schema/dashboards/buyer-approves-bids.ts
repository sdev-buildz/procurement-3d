import { prisma } from '@packages/db/prisma'
import { builder } from '../lib/builder'
import { BidLineItemRef } from '../prisma-objects'

builder.mutationField('approveBids', (t) =>
  t.prismaField({
    type: ['BidLineItem'],
    args: {
      ids: t.arg.intList({ required: true }),
    },
    resolve: async (query, _, { ids }, ctx) => {
      if (ctx.currentUser?.role !== 'BUYER')
        throw new Error('You are not a buyer!')

      await prisma.bidLineItem.updateMany({
        where: { id: { in: ids } },
        data: { isApproved: true },
      })

      ctx.pubsub.publish(
        'bidApproval',
        ids.map((id) => ({ id }))
      )

      return prisma.bidLineItem.findMany({
        ...query,
        where: { id: { in: ids } },
      })
    },
  })
)

builder.subscriptionField('bidApprovals', (t) =>
  t.field({
    type: [BidLineItemRef],
    description: 'Notifies whenever any bids are approved.',
    subscribe: (_parent, _args, ctx) => {
      if (ctx.currentUser?.role !== 'BUYER')
        throw new Error('You are not a buyer!')
      return ctx.pubsub.subscribe('bidApproval')
    },
    resolve: (value) => value,
  })
)
