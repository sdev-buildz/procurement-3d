import { prisma } from '@packages/db/prisma'
import { builder } from '../lib/builder'

builder.mutationField('approveBids', (t) =>
  t.prismaField({
    type: ['BidLineItem'],
    args: {
      ids: t.arg.intList({ required: true }),
    },
    resolve: async (query, _, { ids }) => {
      await prisma.bidLineItem.updateMany({
        where: { id: { in: ids } },
        data: { isApproved: true },
      })

      return prisma.bidLineItem.findMany({
        ...query,
        where: { id: { in: ids } },
      })
    },
  })
)
