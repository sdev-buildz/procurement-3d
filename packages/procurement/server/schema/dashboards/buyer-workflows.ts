import { prisma } from '@packages/db/prisma'
import type { BidLineItem } from '@packages/db/prisma-client'
import { builder } from '../lib/builder'
import { ComplianceEnumRef, CountryEnumRef, RfqRef } from '../prisma-objects'

const SortBidsEnumRef = builder.enumType('SortBidsEnum', {
  values: ['totalAmount', 'leadTimeWeeks'] as const satisfies Array<
    keyof BidLineItem
  >,
})

const PaginationInput = builder.inputType('PaginationInput', {
  fields: (t) => ({
    skip: t.int({ required: false }),
    take: t.int({ required: false }),
  }),
})

const FilterInput = builder.inputType('FilterInput', {
  fields: (t) => ({
    comlianceStatus: t.field({
      type: ComplianceEnumRef,
      required: false,
    }),
    country: t.field({
      type: CountryEnumRef,
      required: false,
    }),
    sort: t.field({
      type: SortBidsEnumRef,
      required: false,
    }),
    ids: t.intList({ required: false }),
    companyNames: t.stringList({ required: false }),
    pagination: t.field({ type: PaginationInput, required: false }),
  }),
})

builder.queryField('bidsOfRfq', (t) =>
  t.prismaField({
    type: [RfqRef],
    args: {
      rfqId: t.arg.int({ required: true }),
      filter: t.arg({ type: FilterInput, required: false }),
    },
    description: 'Used by buyers to review bids.',
    resolve: (query, root, args, context, info) => {
      return prisma.rfq.findMany({
        select: {
          bidClosingDate: true,
          bidsReceived: true,
          approvals: true,
          buyer: true,
          buyerId: true,
          createdAt: true,
          deliveryDeadline: true,
          description: true,
          status: true,
          title: true,
          updatedAt: true,
          id: true,
          lineItems: {
            select: {
              bidLineItems: {
                // Sorting the bids by total amount or lead time
                orderBy: {
                  [args.filter?.sort ?? 'totalAmount']: 'asc',
                },
              },
            },
          },
        },
        where: {
          id: args.rfqId,
          lineItems: {
            every: {
              bidLineItems: {
                every: {
                  bid: {
                    supplier: {
                      ...(args.filter?.comlianceStatus && {
                        complianceStatus: args.filter?.comlianceStatus,
                      }),
                      ...(args.filter?.companyNames && {
                        companyName: {
                          in: args.filter?.companyNames,
                        },
                      }),
                      ...(args.filter?.country && {
                        country: args.filter?.country,
                      }),
                    },
                  },
                },
              },
            },
          },
        },
        take: args.filter?.pagination?.take ?? 40,
        skip: args.filter?.pagination?.skip ?? 0,
      })
    },
  })
)
