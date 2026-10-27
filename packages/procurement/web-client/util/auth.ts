import { UserRole, type LoginUser, type Maybe } from '@types-gen-react-apollo'

/**
 * The list of all the possible user role strings.
 */
const userRoles = Object.values(UserRole)

/**
 * Takes type emitted by pothos codegen and removes optional modifiers (?), and nullability ({@link Maybe}) of values.
 */
type CleanPothos<T> = {
  [K in keyof T as K extends '__typename' ? never : K]-?: T[K] extends Maybe<
    infer U
  >
    ? U
    : T[K]
}

/**
 * Public identity information retained after successful authentication.
 */
export type AuthenticatedUser = CleanPothos<LoginUser>

/**
 * @returns the URL path to the dashboard page associated with the given user role.
 */
export const getRoleHomePath = (role: UserRole) => {
  return `/${role.toLowerCase().replaceAll('_', '-')}`
}

/**
 * Checks whether an API value is one of the supported account roles.
 */
export const isUserRole = (role: unknown): role is UserRole => {
  return typeof role === 'string' && userRoles.includes(role as UserRole)
}
