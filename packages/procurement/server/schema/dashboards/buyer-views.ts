import { prisma } from '@packages/db/prisma'
import { ComplianceStatus, type BidLineItem } from '@packages/db/prisma-client'
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
    type: RfqRef,
    args: {
      rfqId: t.arg.int({ required: true }),
      filter: t.arg({ type: FilterInput, required: false }),
    },
    description: 'Used by buyers to review bids.',
    resolve: (query, root, args, context, info) => {
      const extraSelect = {
        include: {
          lineItems: {
            include: {
              bidLineItems: {
                // Sorting the bids by total amount or lead time
                orderBy: {
                  [args.filter?.sort ?? 'totalAmount']: 'asc',
                },
                take: args.filter?.pagination?.take ?? 40,
                skip: args.filter?.pagination?.skip ?? 0,
              },
            },
          },
        },
      }
      // 2. Use Object.assign to merge the extra select into the Pothos-generated query.
      // Note: If both objects contain a 'select' block, a shallow Object.assign
      // will overwrite the client's selection. We target query.select directly:
      if (query.include) {
        Object.assign(query.include, extraSelect.include)
      } else {
        Object.assign(query, extraSelect)
      }
      return prisma.rfq.findFirst({
        ...query,
        where: {
          id: args.rfqId,
          lineItems: {
            every: {
              bidLineItems: {
                every: {
                  bid: {
                    supplier: {
                      ...(args.filter?.comlianceStatus && {
                        // complianceStatus: args.filter?.comlianceStatus,
                        complianceStatus:
                          ComplianceStatus[args.filter?.comlianceStatus],
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
      })
    },
  })
)
