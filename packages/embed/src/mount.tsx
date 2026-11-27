import { ApolloProvider } from '@apollo/client/react'
import ReactDOM from 'react-dom/client'
import { apolloClient } from './apolloClient'
import { EmbedApp } from './EmbedApp'
import './mount.css'

/**
 * Mounts the standalone 3D editor app into the HTML document.
 */
const mountApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') ?? document.body
  )

  root.render(
    <ApolloProvider client={apolloClient}>
      <EmbedApp />
    </ApolloProvider>
  )
}

mountApp()
