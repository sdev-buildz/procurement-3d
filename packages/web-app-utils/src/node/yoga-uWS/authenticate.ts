import { decryptJwe } from './jwe'
import type { GraphqlContextType } from './types'
import { isWsContext } from './types'

/**
 *  Authenticates the user by parsing the bearer token in the HTTP Authorization header.
 */
export const authenticate = (context: GraphqlContextType): unknown => {
  const authHeader = isWsContext(context)
    ? context.connectionParams?.headers?.authorization
    : context.res.authHeader

  if (!authHeader) return
  const bearerToken = authHeader.startsWith('bearer ')
    ? authHeader.slice('bearer '.length)
    : authHeader

  const jwtPayload = decryptJwe(bearerToken)

  if (!jwtPayload) return

  return JSON.parse(jwtPayload)
}
