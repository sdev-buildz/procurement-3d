import { useReactiveVar } from '@apollo/client/react'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import { useColorScheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { visuallyHidden } from '@mui/utils'
import { useContext } from 'react'
import { AppContext } from '../../contexts/AppContext'
import { ColorModeSwitch } from './ColorModeSwitch'

/**
 * The top NavBar component.
 */
export const NavBar = () => {
  const { isLoggedIn } = useContext(AppContext)
  const isLoggedInState = useReactiveVar(isLoggedIn)

  const { mode, setMode, systemMode } = useColorScheme()

  const getActualMode = (): NonNullable<typeof systemMode> => {
    const currMode = mode === 'system' ? systemMode : mode
    return currMode as ReturnType<typeof getActualMode>
  }

  return (
    <AppBar position='static' variant='elevation' color='transparent'>
      <Toolbar>
        <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
          Shopping Site
        </Typography>

        <FormControlLabel
          control={
            <ColorModeSwitch
              onChange={(event) => {
                setMode(getActualMode() === 'dark' ? 'light' : 'dark')
              }}
              sx={{ m: 1 }}
              value={getActualMode() === 'dark' ? 'checked' : undefined}
              checked={getActualMode() === 'dark'}
            />
          }
          label='Toggle Dark Mode'
          slotProps={{
            typography: {
              style: visuallyHidden,
            },
          }}
        />
        {isLoggedInState ? (
          <Avatar
            sx={{
              bgcolor: 'white',
              width: '2rem',
              height: '2rem',
              marginInline: '1rem',
            }}
            src='static/assets/avatar-1.svg'
          />
        ) : (
          <></>
        )}
        <Button
          color='tertiary'
          variant='outlined'
          onClick={() => isLoggedIn(!isLoggedIn())}
          startIcon={isLoggedInState ? <LoginIcon /> : <LogoutIcon />}
        >
          {isLoggedInState ? 'Log out' : 'Log In'}
        </Button>
      </Toolbar>
    </AppBar>
  )
}
