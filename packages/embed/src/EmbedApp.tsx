import { useEffect, useState, type ReactElement } from 'react'
import { ConfigEditor } from './ConfigEditor'
import './EmbedApp.css'
import { fetchCurrentUser, type AuthenticatedUser } from './auth/currentUser'
import { requestHostAuthToken } from './auth/requestHostAuthToken'

const roleHomeTitle: Record<AuthenticatedUser['role'], string> = {
  BUYER: 'Buyer dashboard',
  SUPPLIER: 'Supplier dashboard',
  SALES_ENGINEER: 'Sales engineering workspace',
  ADMIN: 'Administration dashboard',
}

type EmbedAuthState =
  | { status: 'loading' }
  | { status: 'signed-out'; message: string }
  | { status: 'signed-in'; user: AuthenticatedUser }

/**
 * Authenticates against the host iframe token, then shows the current user
 * and the 3D editor.
 */
export function EmbedApp(): ReactElement {
  const [auth, setAuth] = useState<EmbedAuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    const signInFromHost = async () => {
      const token = await requestHostAuthToken()
      if (cancelled) return

      if (!token) {
        setAuth({
          status: 'signed-out',
          message:
            'Open this editor from the procurement workspace while signed in.',
        })
        return
      }

      window.localStorage.setItem('authToken', token)
      const user = await fetchCurrentUser(token)
      if (cancelled) return

      if (!user) {
        window.localStorage.removeItem('authToken')
        setAuth({
          status: 'signed-out',
          message:
            'The host auth token was rejected. Sign in again on the host.',
        })
        return
      }

      setAuth({ status: 'signed-in', user })
    }

    void signInFromHost()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className='embed-app'>
      {auth.status === 'signed-in' ? (
        <header className='embed-user-bar'>
          <div className='embed-user-copy'>
            <p className='embed-user-welcome'>Welcome, {auth.user.email}</p>
            <p className='embed-user-title'>{roleHomeTitle[auth.user.role]}</p>
          </div>
          <div className='embed-user-avatar' aria-hidden='true'>
            {auth.user.email.slice(0, 1).toUpperCase()}
          </div>
        </header>
      ) : null}
      {auth.status === 'loading' ? (
        <p className='embed-status' role='status'>
          Signing in with the host account…
        </p>
      ) : null}
      {auth.status === 'signed-out' ? (
        <p className='embed-status' role='status'>
          {auth.message}
        </p>
      ) : null}
      <ConfigEditor />
      {/* {auth.status === 'signed-in' ? <ConfigEditor /> : null} */}
    </div>
  )
}
