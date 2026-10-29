import ReactDOM from 'react-dom/client'
import { EmbedApp } from '../src/EmbedApp'
import './index.css'

/**
 * Mounts the standalone 3D editor app into the HTML document.
 */
const mountApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') ?? document.body
  )

  root.render(<EmbedApp />)
}

mountApp()
