/**
 * The Prisma Object Refs for Pothos Prisma Plugin.
 * @packageDocumentation
 */
/* eslint-disable jsdoc/require-jsdoc */
import type PrismaTypes from '@packages/db/pothos-prisma-types'
import {
  COUNTRY,
  ComplianceStatus,
  RfqStatus,
  UserRole,
} from '@packages/db/prisma-client'
import type { PrismaObjectRef } from '@pothos/plugin-prisma'
import { builder, type CustomSchemaTypes } from './lib/builder'

export const UserRoleRef = builder.enumType(UserRole, {
  name: 'UserRole', // Must match the GraphQL enum name
  description: 'User roles',
})

export const UserRef: PrismaObjectRef<
  PothosSchemaTypes.ExtendDefaultTypes<CustomSchemaTypes>,
  PrismaTypes['User1']
> = builder.prismaObject('User1', {
  description: 'A User',
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    role: t.expose('role', { type: UserRoleRef }),
    createdAt: t.expose('createdAt', {
      type: 'DateTime',
    }),
    updatedAt: t.expose('updatedAt', {
      type: 'DateTime',
    }),
  }),
})

export const BuyerRef: PrismaObjectRef<
  PothosSchemaTypes.ExtendDefaultTypes<CustomSchemaTypes>,
  PrismaTypes['Buyer']
> = builder.prismaObject('Buyer', {
  description: 'A Buyer',
  fields: (t) => ({
    id: t.exposeID('id'),
    user: t.relation('user'),

    name: t.exposeString('name'),

    rfqsCreated: t.relation('rfqsCreated'),

    createdAt: t.expose('createdAt', {
      type: 'DateTime',
    }),
    updatedAt: t.expose('updatedAt', {
      type: 'DateTime',
    }),
  }),
})

export const CountryEnumRef = builder.enumType(COUNTRY, {
  name: 'COUNTRY', // Must match the GraphQL enum name
  description: 'COUNTRY',
})

export const ComplianceEnumRef = builder.enumType(ComplianceStatus, {
  name: 'ComplianceStatus', // Must match the GraphQL enum name
  description: 'ComplianceStatus of supplier',
})

export const SupplierRef: PrismaObjectRef<
  PothosSchemaTypes.ExtendDefaultTypes<CustomSchemaTypes>,
  PrismaTypes['Supplier']
> = builder.prismaObject('Supplier', {
  description: 'A Supplier',
  fields: (t) => ({
    id: t.exposeID('id'),
    user: t.relation('user'),

    companyName: t.exposeString('companyName'),
    taxId: t.exposeString('taxId'),
    country: t.expose('country', {
      type: CountryEnumRef,
    }),
    complianceStatus: t.expose('complianceStatus', {
      type: ComplianceEnumRef,
    }),

    bidsSubmitted: t.relation('bidsSubmitted'),
    createdAt: t.expose('createdAt', {
      type: 'DateTime',
    }),
    updatedAt: t.expose('updatedAt', {
      type: 'DateTime',
    }),
  }),
})

export const RfqStatusEnumRef = builder.enumType(RfqStatus, {
  name: 'RfqStatus', // Must match the GraphQL enum name
  description: 'RfqStatus',
})

export const RfqRef: PrismaObjectRef<
  PothosSchemaTypes.ExtendDefaultTypes<CustomSchemaTypes>,
  PrismaTypes['Rfq']
> = builder.prismaObject('Rfq', {
  description: 'A request for quotation',
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description'),
    status: t.exposeString('status'),
    rfqLineItems: t.relation('lineItems'),
    bidClosingDate: t.field({
      type: 'String',
      resolve: ({ bidClosingDate }) => bidClosingDate.toISOString(),
    }),
    deliveryDeadline: t.field({
      type: 'String',
      resolve: ({ deliveryDeadline }) => deliveryDeadline.toISOString(),
    }),
    buyerId: t.exposeID('buyerId'),
    createdAt: t.field({
      type: 'String',
      resolve: ({ createdAt }) => createdAt.toISOString(),
    }),
    updatedAt: t.field({
      type: 'String',
      resolve: ({ updatedAt }) => updatedAt.toISOString(),
    }),
  }),
})

export const RfqLineItemRef: PrismaObjectRef<
  PothosSchemaTypes.ExtendDefaultTypes<CustomSchemaTypes>,
  PrismaTypes['RfqLineItem']
> = builder.prismaObject('RfqLineItem', {
  description: 'A line item in a request for quotation',
  fields: (t) => ({
    id: t.exposeID('id'),
    rfqId: t.exposeID('rfqId'),
    quantity: t.exposeInt('quantity'),
    bidLineItems: t.relation('bidLineItems'),
  }),
})

export const BidRef: PrismaObjectRef<
  PothosSchemaTypes.ExtendDefaultTypes<CustomSchemaTypes>,
  PrismaTypes['Bid']
> = builder.prismaObject('Bid', {
  description: 'A Bid',
  fields: (t) => ({
    id: t.exposeID('id'),
    rfqId: t.exposeID('rfqId'),
    supplierId: t.exposeID('supplierId'),
    supplier: t.relation('supplier'),
    technicalNotes: t.exposeString('technicalNotes'),
    rfq: t.relation('rfq'),
    bidLineItems: t.relation('bidLineItems'),
  }),
})

export const BidLineItemRef: PrismaObjectRef<
  PothosSchemaTypes.ExtendDefaultTypes<CustomSchemaTypes>,
  PrismaTypes['BidLineItem']
> = builder.prismaObject('BidLineItem', {
  description: 'A Bid LineItem',
  fields: (t) => ({
    id: t.exposeID('id', { nullable: true }),
    bidId: t.exposeID('bidId', { nullable: true }),
    bid: t.relation('bid', { nullable: true }),

    leadTimeWeeks: t.exposeInt('leadTimeWeeks', { nullable: true }),
    totalAmount: t.exposeInt('totalAmount', { nullable: true }),

    technicalNotes: t.exposeString('technicalNotes', { nullable: true }),

    rfqLineItem: t.relation('rfqLineItem'),
    rfqLineItemId: t.exposeID('rfqLineItemId', { nullable: true }),
  }),
})

export const ApprovalRef: PrismaObjectRef<
  PothosSchemaTypes.ExtendDefaultTypes<CustomSchemaTypes>,
  PrismaTypes['Approval']
> = builder.prismaObject('Approval', {
  description: 'An Approval to a bid line item',
  fields: (t) => ({
    id: t.exposeID('id'),
    decision: t.exposeBoolean('decision'),
    justification: t.exposeString('justification'),
    rfqId: t.exposeID('rfqId'),
    rfq: t.relation('rfq'),
    bidLineItems: t.relation('bidLineItems'),
  }),
})
