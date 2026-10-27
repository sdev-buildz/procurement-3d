import { makeVarSynced, type ReactiveVarSynced } from 'apollo-state-sync'
import { createContext } from 'react'

/**
 * Type for the {@link AppContext}
 */
export interface AppContextType {
  isLoggedIn: ReactiveVarSynced<boolean>
}

/**
 * To initiate the AppContext with dummy values.
 * These values are only to initialize and not meant to be used by the consuming components.
 */
export const defaultAppContext: AppContextType = {
  isLoggedIn: makeVarSynced(false, 'isLoggedIn'),
}

/**
 * The AppContext is used to provide global context variables.
 */
export const AppContext = createContext<AppContextType>(defaultAppContext)
