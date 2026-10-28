/**
 * @packageDocumentation
 * {@inheritdoc HomePage}
 */
import { useReactiveVar } from '@apollo/client/react'
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined'
import BusinessCenterOutlined from '@mui/icons-material/BusinessCenterOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import EngineeringOutlined from '@mui/icons-material/EngineeringOutlined'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { UserRole } from '@types-gen-react-apollo'
import { Navigate, Link as RouterLink } from 'react-router'
import { defaultAppContext } from '../../contexts/AppContext'
import { getRoleHomePath } from '../../util/auth'

const getSectionId = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/**
 * Different contents to display to users as per their roles
 */
const roleHomeContent: Record<
  UserRole,
  {
    title: string
    description: string
    sections: {
      title: string
      description: string
      href?: string
    }[]
  }
> = {
  BUYER: {
    title: 'Buyer dashboard',
    description: 'Manage sourcing requests and compare supplier bids.',
    sections: [
      {
        title: 'Review bids',
        description: 'Compare supplier offers and track your decisions.',
        href: '/buyer/review-bids',
      },
    ],
  },
  SUPPLIER: {
    title: 'Supplier dashboard',
    description: 'Find procurement opportunities and manage your bids.',
    sections: [
      {
        title: 'Open RFQs',
        description:
          'Review requests that match your products and capabilities.',
      },
      {
        title: 'Your bids',
        description: 'Keep track of submitted offers and their status.',
      },
    ],
  },
  SALES_ENGINEER: {
    title: 'Sales engineering workspace',
    description: 'Manage customer projects and their 3D layouts.',
    sections: [
      {
        title: 'Assigned projects',
        description: 'Review project details and customer requirements.',
      },
      {
        title: '3D layouts',
        description: 'Create and update spatial designs for your projects.',
      },
    ],
  },
  ADMIN: {
    title: 'Administration dashboard',
    description: 'Oversee users and procurement activity across the platform.',
    sections: [
      {
        title: 'User management',
        description: 'Review buyer, supplier, and sales engineer accounts.',
      },
      {
        title: 'Platform activity',
        description: 'Monitor procurement workflows and account activity.',
      },
    ],
  },
}

const roleIcons: Record<UserRole, typeof DashboardOutlined> = {
  BUYER: AssignmentOutlined,
  SUPPLIER: BusinessCenterOutlined,
  SALES_ENGINEER: EngineeringOutlined,
  ADMIN: DashboardOutlined,
}

/**
 * Shows the home dashboard that corresponds to the authenticated user's role.
 */
export const HomePage = ({ role }: { role: UserRole }) => {
  const isLoggedIn = useReactiveVar(defaultAppContext.isLoggedIn)
  const user = useReactiveVar(defaultAppContext.user)

  if (!isLoggedIn || !user) {
    return <Navigate to='/login' replace />
  }

  if (user.role !== role) {
    return <Navigate to={getRoleHomePath(user.role)} replace />
  }

  const content = roleHomeContent[role]
  const RoleIcon = roleIcons[role]

  return (
    <Container component='main' maxWidth='md' sx={{ flexGrow: 1, py: 6 }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography color='text.secondary' variant='body2'>
            Welcome, {user.email}
          </Typography>
          <Typography component='h1' variant='h3'>
            {content.title}
          </Typography>
          <Typography color='text.secondary' variant='h6'>
            {content.description}
          </Typography>
        </Stack>

        <Stack
          component='nav'
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          aria-label={`${content.title} navigation`}
        >
          {content.sections.map(({ title, description, href }) => {
            const sectionId = getSectionId(title)
            const buttonLabel = href ? `Browse ${title}` : `${title} overview`

            return (
              <Paper
                key={title}
                component='section'
                elevation={3}
                aria-labelledby={`${sectionId}-heading`}
                sx={{ flex: 1, minHeight: 180, p: 3 }}
              >
                <Stack spacing={2}>
                  <RoleIcon aria-hidden='true' color='primary' />
                  <Typography
                    component='h2'
                    id={`${sectionId}-heading`}
                    variant='h6'
                  >
                    {title}
                  </Typography>
                  <Typography color='text.secondary' variant='body2'>
                    {description}
                  </Typography>
                  {href ? (
                    <Button
                      component={RouterLink}
                      to={href}
                      variant='outlined'
                      aria-label={buttonLabel}
                    >
                      Browse {title}
                    </Button>
                  ) : null}
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      </Stack>
    </Container>
  )
}
