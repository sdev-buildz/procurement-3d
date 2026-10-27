import { builder } from './lib/builder'
import './products'

/**
 * The Pothos GraphQL Schema
 */
export const schema = builder.toSchema()
