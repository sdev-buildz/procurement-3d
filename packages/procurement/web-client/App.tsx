import { useReactiveVar } from '@apollo/client/react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { LoginPage } from './components/LoginPage/LoginPage'
import { NavBar } from './components/NavBar/NavBar'
import { ProductsPage } from './components/ProductsPage/ProductsPage'
import { AppContext, defaultAppContext } from './contexts/AppContext'

const theme = createTheme({
  colorSchemes: {
    dark: true,
    light: true,
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#E2A0FF',
    },
    secondary: {
      main: '#90F3FF',
    },
    tertiary: {
      main: '#0e6fff', // Replace with your tertiary color hex
    },
    tertiaryVariant: {
      main: '#c4dcff', // Replace with your tertiary color hex
    },
    text: {
      secondary: '#6bc3e2',
    },
    background: {
      default: '#000000',
      paper: '#111111',
    },
  },
})

/**
 * The React App with the navbar, pages, routing, etc...
 * It includes the whole App Layout.
 */
export function App() {
  const isLoggedIn = useReactiveVar(defaultAppContext.isLoggedIn)

  return (
    <div className='app'>
      <ThemeProvider theme={theme} defaultMode='dark'>
        <CssBaseline enableColorScheme />
        <AppContext.Provider value={defaultAppContext}>
          <NavBar />
          {isLoggedIn ? <ProductsPage /> : <LoginPage />}
        </AppContext.Provider>
      </ThemeProvider>
    </div>
  )
}
