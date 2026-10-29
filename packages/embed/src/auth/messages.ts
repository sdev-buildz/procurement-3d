/**
 * Message type sent by the iframe to ask the host for an auth token.
 */
export const AUTH_TOKEN_REQUEST_TYPE = 'cloudworx:auth-token-request'

/**
 * Message type sent by the host with the current auth token.
 */
export const AUTH_TOKEN_RESPONSE_TYPE = 'cloudworx:auth-token-response'

/**
 * Token request sent from the embedded editor to the host window.
 */
export type AuthTokenRequestMessage = {
  type: typeof AUTH_TOKEN_REQUEST_TYPE
}

/**
 * Token payload sent from the host window to the embedded editor.
 */
export type AuthTokenResponseMessage = {
  type: typeof AUTH_TOKEN_RESPONSE_TYPE
  token: string | null
}

/**
 * @returns whether the value is a host-auth token request.
 */
export const isAuthTokenRequestMessage = (
  data: unknown
): data is AuthTokenRequestMessage => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    data.type === AUTH_TOKEN_REQUEST_TYPE
  )
}

/**
 * @returns whether the value is a host-auth token response.
 */
export const isAuthTokenResponseMessage = (
  data: unknown
): data is AuthTokenResponseMessage => {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('type' in data) ||
    data.type !== AUTH_TOKEN_RESPONSE_TYPE
  ) {
    return false
  }

  if (!('token' in data)) {
    return false
  }

  return data.token === null || typeof data.token === 'string'
}

/**
 * @returns a token request message for `window.parent.postMessage`.
 */
export const createAuthTokenRequestMessage = (): AuthTokenRequestMessage => ({
  type: AUTH_TOKEN_REQUEST_TYPE,
})

/**
 * @returns a token response message for the embedded editor.
 */
export const createAuthTokenResponseMessage = (
  token: string | null
): AuthTokenResponseMessage => ({
  type: AUTH_TOKEN_RESPONSE_TYPE,
  token,
})
