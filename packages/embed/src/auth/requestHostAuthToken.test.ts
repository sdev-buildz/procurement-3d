import { sharedConfig } from '@packages/web-app-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_TOKEN_RESPONSE_TYPE,
  createAuthTokenResponseMessage,
} from './messages'
import {
  isEmbeddedInIframe,
  requestHostAuthToken,
} from './requestHostAuthToken'

const hostOrigin = sharedConfig.webClientOrigin

describe('requestHostAuthToken', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns null when the editor is not running in an iframe', async () => {
    await expect(requestHostAuthToken()).resolves.toBeNull()
    expect(isEmbeddedInIframe()).toBe(false)
  })

  it('resolves with the token posted by the host', async () => {
    const parent = {
      postMessage: vi.fn(),
    }
    vi.spyOn(window, 'parent', 'get').mockReturnValue(
      parent as unknown as Window
    )

    const pending = requestHostAuthToken({ hostOrigin })
    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: 'cloudworx:auth-token-request' },
      hostOrigin
    )

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: hostOrigin,
        data: createAuthTokenResponseMessage('host-token'),
      })
    )

    await expect(pending).resolves.toBe('host-token')
  })

  it('ignores messages from other origins', async () => {
    vi.useFakeTimers()
    const parent = {
      postMessage: vi.fn(),
    }
    vi.spyOn(window, 'parent', 'get').mockReturnValue(
      parent as unknown as Window
    )

    const pending = requestHostAuthToken({ hostOrigin, timeoutMs: 20 })
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example',
        data: {
          type: AUTH_TOKEN_RESPONSE_TYPE,
          token: 'stolen',
        },
      })
    )

    const resultPromise = pending
    await vi.advanceTimersByTimeAsync(20)
    await expect(resultPromise).resolves.toBeNull()
  })
})
