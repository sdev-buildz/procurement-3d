import './auth'
import './dashboards'
import { builder } from './lib/builder'
import './oidc'
import './prisma-objects'
import './time-series'

/**
 * The Pothos GraphQL Schema
 */
export const schema = builder.toSchema()
