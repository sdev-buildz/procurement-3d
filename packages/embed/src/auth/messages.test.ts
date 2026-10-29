import { describe, expect, it } from 'vitest'
import {
  AUTH_TOKEN_REQUEST_TYPE,
  AUTH_TOKEN_RESPONSE_TYPE,
  createAuthTokenRequestMessage,
  createAuthTokenResponseMessage,
  isAuthTokenRequestMessage,
  isAuthTokenResponseMessage,
} from './messages'

describe('iframe auth messages', () => {
  it('accepts well-formed request and response payloads', () => {
    expect(isAuthTokenRequestMessage(createAuthTokenRequestMessage())).toBe(
      true
    )
    expect(
      isAuthTokenResponseMessage(createAuthTokenResponseMessage('token-1'))
    ).toBe(true)
    expect(
      isAuthTokenResponseMessage(createAuthTokenResponseMessage(null))
    ).toBe(true)
  })

  it('rejects unrelated or incomplete payloads', () => {
    expect(isAuthTokenRequestMessage({ type: AUTH_TOKEN_RESPONSE_TYPE })).toBe(
      false
    )
    expect(isAuthTokenResponseMessage({ type: AUTH_TOKEN_REQUEST_TYPE })).toBe(
      false
    )
    expect(isAuthTokenResponseMessage({ type: AUTH_TOKEN_RESPONSE_TYPE })).toBe(
      false
    )
    expect(
      isAuthTokenResponseMessage({
        type: AUTH_TOKEN_RESPONSE_TYPE,
        token: 12,
      })
    ).toBe(false)
    expect(isAuthTokenRequestMessage(null)).toBe(false)
    expect(isAuthTokenResponseMessage('token')).toBe(false)
  })
})
