import { prisma } from '@packages/db/prisma'
import { createYoga } from 'graphql-yoga'
import { scryptSync } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { schema } from '../schema'
import { pubsub } from '../util/pubsub'

const { findUnique } = vi.hoisted(() => ({
  findUnique: vi.fn(),
}))

vi.mock('@packages/db/prisma', () => ({
  prisma: {
    user1: {
      findUnique,
    },
  },
}))

const testPassword = 'oNW-h7W5PHIOF2LK--facbM7'
const testSalt = 'a0a64cf9260d3676ca161c1b43c9b7e2'
const testUser = {
  id: 1,
  email: 'buyer1@example.test',
  role: 'BUYER' as const,
  passwordHash: scryptSync(testPassword, testSalt, 64).toString('hex'),
  salt: testSalt,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const loginMutation = `
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
`

const yoga = createYoga({
  schema,
  context: () => ({ currentUser: undefined, reqOrigin: '', pubsub }),
})

type LoginResponse = {
  data?: {
    login: {
      token: string
      user: {
        id: string
        email: string
        role: string
      }
    } | null
  }
  errors?: Array<{ message: string }>
}

const executeLogin = (email: string, password: string) =>
  yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: loginMutation,
      variables: { email, password },
    }),
  })

const meQuery = `
  query Me {
    me {
      id
      email
      role
    }
  }
`

type MeResponse = {
  data?: {
    me: {
      id: string
      email: string
      role: string
    } | null
  }
  errors?: Array<{ message: string }>
}

describe('me query', () => {
  it('returns the authenticated user', async () => {
    const yogaWithUser = createYoga({
      schema,
      context: () => ({
        currentUser: {
          id: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        reqOrigin: '',
        pubsub,
      }),
    })

    const response = await yogaWithUser.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: meQuery }),
    })
    const result = (await response.json()) as MeResponse

    expect(response.status).toBe(200)
    expect(result.errors).toBeUndefined()
    expect(result.data?.me).toEqual({
      id: '1',
      email: testUser.email,
      role: testUser.role,
    })
  })

  it('returns null when no user is authenticated', async () => {
    const response = await yoga.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: meQuery }),
    })
    const result = (await response.json()) as MeResponse

    expect(response.status).toBe(200)
    expect(result.errors).toBeUndefined()
    expect(result.data?.me).toBeNull()
  })
})

describe('login mutation', () => {
  beforeEach(() => {
    vi.mocked(prisma.user1.findUnique).mockResolvedValue(testUser)
  })

  it('authenticates valid credentials and returns a token and public user data', async () => {
    const response = await executeLogin(' BUYER1@EXAMPLE.TEST ', testPassword)
    const result = (await response.json()) as LoginResponse

    expect(response.status).toBe(200)
    expect(result.errors).toBeUndefined()
    const login = result.data?.login
    expect(login).toMatchObject({
      user: {
        id: '1',
        email: testUser.email,
        role: 'BUYER',
      },
    })
    if (!login) {
      throw new Error('Expected login to return a result.')
    }

    expect(login.token).toEqual(expect.any(String))
    expect(login.user).not.toHaveProperty('passwordHash')
    expect(prisma.user1.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: testUser.email },
      })
    )
  })

  it('rejects invalid credentials', async () => {
    const response = await executeLogin(testUser.email, 'incorrect-password')
    const result = (await response.json()) as LoginResponse

    expect(response.status).toBe(200)
    expect(result.data?.login).toBeNull()
    expect(result.errors).toHaveLength(1)
  })
})
