import { builder } from './lib/builder'
import './auth'
import './products'

/**
 * The Pothos GraphQL Schema
 */
export const schema = builder.toSchema()
