import { useReactiveVar } from '@apollo/client/react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { UserRole } from '@types-gen-react-apollo'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { HomePage } from './components/HomePage/HomePage'
import { LoginPage } from './components/LoginPage/LoginPage'
import { NavBar } from './components/NavBar/NavBar'
import { ProductsPage } from './components/ProductsPage/ProductsPage'
import { AppContext, defaultAppContext } from './contexts/AppContext'
import { getRoleHomePath } from './util/auth'

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
  const user = useReactiveVar(defaultAppContext.user)

  return (
    <div className='app'>
      <ThemeProvider theme={theme} defaultMode='dark'>
        <CssBaseline enableColorScheme />
        <AppContext.Provider value={defaultAppContext}>
          <BrowserRouter>
            <NavBar />
            <Routes>
              <Route
                path='/'
                element={
                  isLoggedIn && user ? (
                    <Navigate to={getRoleHomePath(user.role)} replace />
                  ) : (
                    <Navigate to='/login' replace />
                  )
                }
              />
              <Route
                path='/login'
                element={
                  isLoggedIn && user ? (
                    <Navigate to={getRoleHomePath(user.role)} replace />
                  ) : (
                    <LoginPage />
                  )
                }
              />
              <Route
                path='/buyer'
                element={<HomePage role={UserRole.Buyer} />}
              />
              <Route
                path='/supplier'
                element={<HomePage role={UserRole.Supplier} />}
              />
              <Route
                path='/sales-engineer'
                element={<HomePage role={UserRole.SalesEngineer} />}
              />
              <Route
                path='/admin'
                element={<HomePage role={UserRole.Admin} />}
              />
              <Route
                path='/catalog'
                element={
                  isLoggedIn && user ? (
                    <ProductsPage />
                  ) : (
                    <Navigate to='/login' replace />
                  )
                }
              />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </BrowserRouter>
        </AppContext.Provider>
      </ThemeProvider>
    </div>
  )
}
