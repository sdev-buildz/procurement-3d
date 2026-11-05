import type { ApolloClient } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '../web-client/App'
import { apolloClient } from '../web-client/contexts/ApolloClient'
import { HtmlHeadChildren } from '../web-client/HtmlHeadChildren'
import '../web-client/mount.css'

/**
 * Mounts the children of the head tag such as Script tags, Link tags, etc...
 *  onto the HTML head tag.
 */
const mountHeadTag = () => {
  const headTag = document.getElementsByTagName('head')[0]
  if (headTag) {
    const headRoot = ReactDOM.createRoot(headTag)
    headRoot.render(<HtmlHeadChildren />)
  }
}

mountHeadTag()

/**
 * Mounts our React app into the HTML document.
 */
const mountApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') ?? document.body
  )

  root.render(
    <StrictMode>
      <ApolloProvider client={apolloClient as unknown as ApolloClient}>
        <App />
      </ApolloProvider>
    </StrictMode>
  )
}
mountApp()
