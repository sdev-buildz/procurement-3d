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

interface LogoutCacheClient {
  clearStore: () => Promise<unknown>
}

export interface LogoutCleanupOptions {
  cacheClient?: LogoutCacheClient
  localStorage?: Storage
  sessionStorage?: Storage
  cacheStorage?: CacheStorage
  indexedDatabase?: IDBFactory
  serviceWorker?: ServiceWorkerContainer
}

/**
 * Clears persisted and cached browser state when a user logs out.
 */
export const clearLogoutData = async (
  options: LogoutCleanupOptions = {}
): Promise<void> => {
  const browserLocalStorage =
    options.localStorage ??
    (typeof window === 'undefined' ? undefined : window.localStorage)
  const browserSessionStorage =
    options.sessionStorage ??
    (typeof window === 'undefined' ? undefined : window.sessionStorage)

  browserLocalStorage?.clear()
  browserSessionStorage?.clear()

  if (options.cacheClient) {
    await options.cacheClient.clearStore()
  }

  const cacheStorage =
    options.cacheStorage ?? (typeof caches === 'undefined' ? undefined : caches)
  if (cacheStorage) {
    const cacheNames = await cacheStorage.keys()
    await Promise.all(cacheNames.map((name) => cacheStorage.delete(name)))
  }

  const indexedDatabase =
    options.indexedDatabase ??
    (typeof indexedDB === 'undefined' ? undefined : indexedDB)
  if (indexedDatabase?.databases) {
    const databases = await indexedDatabase.databases()
    await Promise.all(
      databases.map(
        (database) =>
          database.name &&
          new Promise<void>((resolve, reject) => {
            const request = indexedDatabase.deleteDatabase(database.name!)
            request.addEventListener('success', () => resolve())
            request.addEventListener('error', () =>
              reject(
                request.error ?? new Error('Unable to delete browser database')
              )
            )
          })
      )
    )
  }

  const serviceWorker =
    options.serviceWorker ??
    (typeof navigator === 'undefined' ? undefined : navigator.serviceWorker)
  if (serviceWorker) {
    const registrations = await serviceWorker.getRegistrations()
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    )
  }
}
