import { gql, type TypedDocumentNode } from '@apollo/client'
import { useMutation } from '@apollo/client/react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { Mutation } from '@types-gen-react-apollo'
import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { AppContext } from '../../contexts/AppContext'
import { getRoleHomePath, isUserRole } from '../../util/auth'
import './GoogleSsoButton.css'

const oidcInitMutation = gql`
  mutation OidcInit {
    oidcInit {
      authorizationUrl
    }
  }
` as TypedDocumentNode<Pick<Mutation, 'oidcInit'>>

const exchangeAuthCodeMutation = gql`
  mutation ExchangeAuthCode(
    $pkceSessionToken: String!
    $authorizationCode: String!
  ) {
    exchangeAuthCode(
      pkceSessionToken: $pkceSessionToken
      authorizationCode: $authorizationCode
    ) {
      token
      user {
        id
        email
        role
      }
    }
  }
` as TypedDocumentNode<Pick<Mutation, 'exchangeAuthCode'>>

/**
 * Starts Google sign-in and completes the authorization-code callback.
 */
export const GoogleSsoButton = () => {
  const { isLoggedIn, user } = useContext(AppContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [callbackError, setCallbackError] = useState<string | null>(null)
  const hasExchangedAuthCode = useRef(false)
  const searchParams = new URLSearchParams(location.search)
  const authorizationCode =
    searchParams.get('code') ?? searchParams.get('auth-code')
  const pkceSessionToken = searchParams.get('state')

  const [
    initOidc,
    {
      data: initData,
      error: initError,
      loading: initLoading,
      reset: resetInitOidc,
    },
  ] = useMutation(oidcInitMutation, { fetchPolicy: 'network-only' })
  const [
    exchangeAuthCode,
    { error: exchangeError, loading: exchangeLoading, reset: resetExchange },
  ] = useMutation(exchangeAuthCodeMutation, {
    onCompleted: ({ exchangeAuthCode: result }) => {
      const loginUser = result?.user
      if (
        !result?.token ||
        typeof loginUser?.id !== 'string' ||
        typeof loginUser.email !== 'string' ||
        !isUserRole(loginUser.role)
      ) {
        setCallbackError('Google sign-in returned invalid user information.')
        return
      }

      window.localStorage.setItem('authToken', result.token)
      user({
        id: loginUser.id,
        email: loginUser.email,
        role: loginUser.role,
        salesProfile: loginUser.salesProfile ?? null,
      })
      isLoggedIn(true)
      navigate(getRoleHomePath(loginUser.role), { replace: true })
    },
  })

  useEffect(() => {
    if (authorizationCode !== null) {
      if (!pkceSessionToken) {
        setCallbackError('Google sign-in session is missing. Please try again.')
        return
      }

      if (hasExchangedAuthCode.current) {
        return
      }
      hasExchangedAuthCode.current = true

      void exchangeAuthCode({
        variables: {
          authorizationCode,
          pkceSessionToken,
        },
      }).catch(() => undefined)
      return
    }

    void initOidc()
  }, [authorizationCode, exchangeAuthCode, initOidc, pkceSessionToken])

  const authorizationUrl = initData?.oidcInit?.authorizationUrl
  const errorMessage =
    callbackError ?? exchangeError?.message ?? initError?.message
  const isSigningIn = authorizationCode !== null && exchangeLoading

  const retryInitOidc = () => {
    resetInitOidc()
    resetExchange()
    setCallbackError(null)

    if (authorizationCode !== null) {
      navigate(location.pathname, { replace: true })
      return
    }

    void initOidc()
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {errorMessage ? (
        <Alert severity='error' role='alert' aria-live='assertive'>
          <AlertTitle>Google sign-in failed</AlertTitle>
          {errorMessage}
        </Alert>
      ) : null}
      {authorizationCode !== null ? (
        errorMessage ? (
          <button
            type='button'
            disabled={initLoading}
            className='gsi-button vertical-align'
            onClick={retryInitOidc}
          >
            <div className='gsi-button-content'>
              <div className='gsi-svg'>
                <svg
                  version='1.1'
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  viewBox='0 0 48 48'
                  style={{ display: 'block' }}
                >
                  <path
                    fill='#EA4335'
                    d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
                  ></path>
                  <path
                    fill='#4285F4'
                    d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
                  ></path>
                  <path
                    fill='#FBBC05'
                    d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
                  ></path>
                  <path
                    fill='#34A853'
                    d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
                  ></path>
                  <path fill='none' d='M0 0h48v48H0z'></path>
                </svg>
              </div>
              {initLoading ? (
                <CircularProgress
                  aria-label='Preparing Google sign-in'
                  color='inherit'
                  size={24}
                />
              ) : (
                'Try again'
              )}
            </div>
          </button>
        ) : (
          <Typography color='text.secondary' role='status' aria-live='polite'>
            {isSigningIn ? (
              <>
                <CircularProgress
                  aria-label='Signing in with Google'
                  color='inherit'
                  size={18}
                  sx={{ mr: 1, verticalAlign: 'middle' }}
                />
                Signing in with Google…
              </>
            ) : (
              'Completing Google sign-in…'
            )}
          </Typography>
        )
      ) : (
        <button
          type='button'
          disabled={initLoading}
          className='gsi-button vertical-align'
          onClick={() => {
            if (errorMessage) {
              retryInitOidc()
              return
            }
            if (authorizationUrl) {
              window.location.assign(authorizationUrl)
            } else {
              void initOidc()
            }
          }}
        >
          <div className='gsi-button-content'>
            <div className='gsi-svg'>
              <svg
                version='1.1'
                xmlns='http://www.w3.org/2000/svg'
                width='20'
                viewBox='0 0 48 48'
                style={{ display: 'block' }}
              >
                <path
                  fill='#EA4335'
                  d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
                ></path>
                <path
                  fill='#4285F4'
                  d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
                ></path>
                <path
                  fill='#FBBC05'
                  d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
                ></path>
                <path
                  fill='#34A853'
                  d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
                ></path>
                <path fill='none' d='M0 0h48v48H0z'></path>
              </svg>
            </div>
            {initLoading ? (
              <CircularProgress
                aria-label='Preparing Google sign-in'
                color='inherit'
                size={24}
              />
            ) : errorMessage ? (
              'Try again'
            ) : (
              'Continue with Google'
            )}
          </div>
        </button>
      )}
    </Stack>
  )
}
