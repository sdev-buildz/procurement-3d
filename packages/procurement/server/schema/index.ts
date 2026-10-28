import './auth'
import './dashboards'
import { builder } from './lib/builder'
import './prisma-objects'
import './products'

/**
 * The Pothos GraphQL Schema
 */
export const schema = builder.toSchema()
