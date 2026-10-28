import { gql, type TypedDocumentNode } from '@apollo/client'
import { useMutation } from '@apollo/client/react'
import LockOutlined from '@mui/icons-material/LockOutlined'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { Mutation } from '@types-gen-react-apollo'
import { useContext, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AppContext } from '../../contexts/AppContext'
import { getRoleHomePath, isUserRole } from '../../util/auth'

const loginMutation = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        role
      }
    }
  }
` as TypedDocumentNode<Pick<Mutation, 'login'>>

/**
 * Presents the login form and authenticates the user with the GraphQL API.
 */
export const LoginPage = () => {
  const { isLoggedIn, user } = useContext(AppContext)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [login, { loading, error }] = useMutation(loginMutation, {
    onCompleted: ({ login: result }) => {
      const loginUser = result?.user
      if (
        !result?.token ||
        typeof loginUser?.id !== 'string' ||
        typeof loginUser.email !== 'string' ||
        !isUserRole(loginUser.role)
      ) {
        return
      }

      window.localStorage.setItem('authToken', result.token)
      user({
        id: loginUser.id,
        email: loginUser.email,
        role: loginUser.role,
      })
      isLoggedIn(true)
      navigate(getRoleHomePath(loginUser.role), { replace: true })
    },
  })

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void login({
      variables: {
        email: username.trim(),
        password,
      },
    })
  }

  const usernameHelperText =
    'Use the email address associated with your account.'

  return (
    <Container
      component='main'
      maxWidth='xs'
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 1,
        minHeight: 'calc(100vh - 64px)',
        py: 4,
      }}
    >
      <Paper elevation={6} sx={{ width: '100%', p: { xs: 3, sm: 4 } }}>
        <Stack
          component='form'
          onSubmit={submitLogin}
          spacing={2.5}
          aria-labelledby='login-title'
          aria-busy={loading}
          noValidate
        >
          <Stack sx={{ alignItems: 'center' }} spacing={1}>
            <Avatar
              aria-hidden='true'
              sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
            >
              <LockOutlined />
            </Avatar>
            <Typography component='h1' id='login-title' variant='h5'>
              Sign in
            </Typography>
            <Typography color='text.secondary' variant='body2'>
              Sign in to continue to the procurement catalog.
            </Typography>
          </Stack>

          {error ? (
            <Alert severity='error' role='alert' aria-live='assertive'>
              {error.message}
            </Alert>
          ) : null}

          <TextField
            autoComplete='username'
            autoFocus
            fullWidth
            id='login-username'
            slotProps={{
              htmlInput: {
                'aria-describedby': 'login-username-help',
                'aria-invalid': !!error,
              },
              formHelperText: { id: 'login-username-help' },
            }}
            label='Username'
            name='username'
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
            helperText={usernameHelperText}
          />
          <TextField
            autoComplete='current-password'
            fullWidth
            id='login-password'
            slotProps={{
              htmlInput: {
                'aria-invalid': !!error,
              },
            }}
            label='Password'
            name='password'
            onChange={(event) => setPassword(event.target.value)}
            required
            type='password'
            value={password}
          />
          <Box>
            <Button
              aria-label={loading ? 'Signing in' : 'Sign in'}
              disabled={loading}
              fullWidth
              size='large'
              type='submit'
              variant='contained'
            >
              {loading ? (
                <CircularProgress
                  aria-label='Signing in'
                  color='inherit'
                  size={24}
                />
              ) : (
                'Sign in'
              )}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}
