import { useReactiveVar } from '@apollo/client/react'
import {
  createAuthTokenResponseMessage,
  isAuthTokenRequestMessage,
} from '@packages/embed-3d'
import { sharedConfig } from '@packages/web-app-utils/shared'
import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router'
import { defaultAppContext } from '../../contexts/AppContext'

const postAuthToken = (target: Window) => {
  target.postMessage(
    createAuthTokenResponseMessage(window.localStorage.getItem('authToken')),
    sharedConfig.embedClientOrigin
  )
}

/**
 * Hosts the 3D editor on a separate localhost origin inside an iframe and
 * forwards the signed-in user's auth token to it.
 */
export const SalesEditor = () => {
  const isLoggedIn = useReactiveVar(defaultAppContext.isLoggedIn)
  const user = useReactiveVar(defaultAppContext.user)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== sharedConfig.embedClientOrigin) return
      if (!isAuthTokenRequestMessage(event.data)) return
      const source = event.source
      if (!source || !('postMessage' in source)) return
      postAuthToken(source as Window)
    }

    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])

  if (!isLoggedIn || !user) {
    return <Navigate to='/login' replace />
  }

  return (
    <iframe
      ref={iframeRef}
      title='3D configuration editor'
      sandbox='allow-scripts allow-same-origin'
      src={sharedConfig.embedClientOrigin}
      style={{
        width: '100%',
        flexGrow: 1,
        minHeight: 'calc(100vh - 64px)',
        border: 0,
        display: 'block',
      }}
      onLoad={() => {
        const frameWindow = iframeRef.current?.contentWindow
        if (frameWindow) {
          postAuthToken(frameWindow)
        }
      }}
    />
  )
}
