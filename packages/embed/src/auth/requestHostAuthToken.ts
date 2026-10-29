import { sharedConfig } from '@packages/web-app-utils/shared'
import {
  createAuthTokenRequestMessage,
  isAuthTokenResponseMessage,
} from './messages'

const defaultTimeoutMs = 5000

/**
 * @returns whether this window is running inside a host iframe.
 */
export const isEmbeddedInIframe = (): boolean => {
  return window.parent !== window.self
}

type RequestHostAuthTokenOptions = {
  hostOrigin?: string
  timeoutMs?: number
}

/**
 * Asks the host window for its stored auth token when this app is iframed.
 */
export const requestHostAuthToken = (
  options: RequestHostAuthTokenOptions = {}
): Promise<string | null> => {
  const hostOrigin = options.hostOrigin ?? sharedConfig.webClientOrigin
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs

  if (!isEmbeddedInIframe()) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    let settled = false

    const finish = (token: string | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      window.removeEventListener('message', onMessage)
      resolve(token)
    }

    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== hostOrigin) return
      if (!isAuthTokenResponseMessage(event.data)) return
      finish(event.data.token)
    }

    const timeoutId = window.setTimeout(() => {
      finish(null)
    }, timeoutMs)

    window.addEventListener('message', onMessage)
    window.parent.postMessage(createAuthTokenRequestMessage(), hostOrigin)
  })
}
