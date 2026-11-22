import { sharedConfig } from '@packages/web-app-utils/shared'

const userRoles = ['BUYER', 'SUPPLIER', 'SALES_ENGINEER', 'ADMIN'] as const

/**
 * Supported account roles returned by the procurement GraphQL API.
 */
type UserRole = (typeof userRoles)[number]

/**
 * Public identity information retained after successful authentication.
 */
export type AuthenticatedUser = {
  id: string
  email: string
  role: UserRole
  salesProfile: { name: string } | null
}

const meQuery = `
  query Me {
    me {
      id
      email
      role
      salesProfile {
        name
      }
    }
  }
`

const isUserRole = (role: unknown): role is UserRole => {
  return typeof role === 'string' && userRoles.includes(role as UserRole)
}

type MeResponse = {
  data?: {
    me?: {
      id?: string | null
      email?: string | null
      role?: string | null
      salesProfile?: { name?: string | null } | null
    } | null
  }
  errors?: Array<{ message: string }>
}

/**
 * Loads the authenticated user with a host-provided bearer token.
 */
export const fetchCurrentUser = async (
  token: string
): Promise<AuthenticatedUser | null> => {
  const response = await fetch(sharedConfig.graphqlEndpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: meQuery }),
  })

  const result = (await response.json()) as MeResponse
  const user = result.data?.me
  const salesProfileName = user?.salesProfile?.name

  if (
    result.errors?.length ||
    typeof user?.id !== 'string' ||
    typeof user.email !== 'string' ||
    !isUserRole(user.role) ||
    (user?.salesProfile != null &&
      (typeof salesProfileName !== 'string' || salesProfileName.length === 0))
  ) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    salesProfile:
      typeof salesProfileName === 'string' ? { name: salesProfileName } : null,
  }
}
