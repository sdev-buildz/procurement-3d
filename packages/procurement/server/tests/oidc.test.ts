import { sharedConfig } from '@packages/web-app-utils'
import { createYoga } from 'graphql-yoga'
import { createHash } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { schema } from '../schema'
import { pubsub } from '../util/pubsub'

const { upsert } = vi.hoisted(() => ({
  upsert: vi.fn(),
}))

const prisma = {
  user1: { upsert },
}

const testUser = {
  id: 1,
  email: 'google-user@example.test',
  role: 'SALES_ENGINEER' as const,
}

const yoga = createYoga({
  schema,
  context: () => ({
    currentUser: undefined,
    prisma,
    reqOrigin: '',
    pubsub,
  }),
})

const oidcInitMutation = `
  mutation OidcInit {
    oidcInit {
      authorizationUrl
    }
  }
`

const exchangeAuthCodeMutation = `
  mutation ExchangeAuthCode(
    $pkceSessionToken: String!
    $authorizationCode: String!
  ) {
    exchangeAuthCode(
      pkceSessionToken: $pkceSessionToken
      authorizationCode: $authorizationCode
    ) {
      token
      user {
        id
        email
        role
      }
    }
  }
`

type OidcInitResponse = {
  data?: {
    oidcInit: {
      authorizationUrl: string
    } | null
  }
  errors?: Array<{ message: string }>
}

type ExchangeAuthCodeResponse = {
  data?: {
    exchangeAuthCode: {
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

const execute = (query: string, variables?: Record<string, string>) =>
  yoga.fetch('http://localhost/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

const startOidcSession = async () => {
  const response = await execute(oidcInitMutation)
  const result = (await response.json()) as OidcInitResponse
  const session = result.data?.oidcInit
  if (!session) throw new Error('Expected OIDC initialization to succeed.')
  return {
    response,
    session,
    authorizationUrl: new URL(session.authorizationUrl),
  }
}

describe('OIDC mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GOOGLE_OAUTH2_CLIENT_ID', 'test-client-id')
    vi.stubEnv('GOOGLE_OAUTH2_CLIENT_SECRET', 'test-client-secret')
    vi.stubEnv('JWE_KEY', 'a'.repeat(32))
    vi.mocked(prisma.user1.upsert).mockResolvedValue(testUser)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('creates a Google authorization URL with PKCE and a session state', async () => {
    const { response, authorizationUrl } = await startOidcSession()

    expect(response.status).toBe(200)
    expect(authorizationUrl.origin).toBe('https://accounts.google.com')
    expect(authorizationUrl.pathname).toBe('/o/oauth2/v2/auth')
    expect(authorizationUrl.searchParams.get('client_id')).toBe(
      'test-client-id'
    )
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      sharedConfig.webClientOrigin
    )
    expect(authorizationUrl.searchParams.get('response_type')).toBe('code')
    expect(authorizationUrl.searchParams.get('code_challenge_method')).toBe(
      'S256'
    )
    expect(authorizationUrl.searchParams.get('state')).toEqual(
      expect.any(String)
    )
  })

  it('exchanges the code using the matching PKCE session and consumes its state', async () => {
    const { authorizationUrl } = await startOidcSession()
    const pkceSessionToken = authorizationUrl.searchParams.get('state')
    if (!pkceSessionToken) throw new Error('Expected an OAuth state value.')

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id_token: 'google-id-token' }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            aud: 'test-client-id',
            iss: 'https://accounts.google.com',
            sub: 'google-user-id',
            email: testUser.email,
            email_verified: 'true',
            exp: String(Math.floor(Date.now() / 1000) + 3600),
            nonce: authorizationUrl.searchParams.get('nonce'),
          }),
          { status: 200 }
        )
      )

    const response = await execute(exchangeAuthCodeMutation, {
      pkceSessionToken,
      authorizationCode: 'authorization-code',
    })
    const result = (await response.json()) as ExchangeAuthCodeResponse
    const request = fetchSpy.mock.calls[0]?.[1]
    const tokenBody = new URLSearchParams(String(request?.body))
    const codeVerifier = tokenBody.get('code_verifier') ?? ''

    expect(response.status).toBe(200)
    expect(result.errors).toBeUndefined()
    expect(result.data?.exchangeAuthCode).toMatchObject({
      user: {
        id: String(testUser.id),
        email: testUser.email,
        role: 'SALES_ENGINEER',
      },
    })
    expect(result.data?.exchangeAuthCode?.token).toEqual(expect.any(String))
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' })
    )
    expect(tokenBody.get('client_id')).toBe('test-client-id')
    expect(tokenBody.get('client_secret')).toBe('test-client-secret')
    expect(tokenBody.get('code')).toBe('authorization-code')
    expect(tokenBody.get('redirect_uri')).toBe(sharedConfig.webClientOrigin)
    const tokenInfoUrl = new URL(String(fetchSpy.mock.calls[1]?.[0]))
    expect(tokenInfoUrl.origin + tokenInfoUrl.pathname).toBe(
      'https://oauth2.googleapis.com/tokeninfo'
    )
    expect(tokenInfoUrl.searchParams.get('id_token')).toBe('google-id-token')
    expect(prisma.user1.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: testUser.email },
        create: expect.objectContaining({
          email: testUser.email,
          role: 'SALES_ENGINEER',
          passwordHash: expect.any(String),
          salt: expect.any(String),
        }),
        update: {},
      })
    )
    expect(createHash('sha256').update(codeVerifier).digest('base64url')).toBe(
      authorizationUrl.searchParams.get('code_challenge')
    )

    const replayResponse = await execute(exchangeAuthCodeMutation, {
      pkceSessionToken,
      authorizationCode: 'authorization-code',
    })
    const replayResult =
      (await replayResponse.json()) as ExchangeAuthCodeResponse

    expect(replayResult.errors).toHaveLength(1)
    expect(replayResult.data?.exchangeAuthCode).toBeNull()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('does not create or log in a user for an unverified Google email', async () => {
    const { authorizationUrl } = await startOidcSession()
    const pkceSessionToken = authorizationUrl.searchParams.get('state')
    if (!pkceSessionToken) throw new Error('Expected an OAuth state value.')

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id_token: 'google-id-token' }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            aud: 'test-client-id',
            iss: 'https://accounts.google.com',
            sub: 'google-user-id',
            email: testUser.email,
            email_verified: 'false',
            exp: String(Math.floor(Date.now() / 1000) + 3600),
            nonce: authorizationUrl.searchParams.get('nonce'),
          }),
          { status: 200 }
        )
      )

    const response = await execute(exchangeAuthCodeMutation, {
      pkceSessionToken,
      authorizationCode: 'authorization-code',
    })
    const result = (await response.json()) as ExchangeAuthCodeResponse

    expect(result.data?.exchangeAuthCode).toBeNull()
    expect(result.errors).toHaveLength(1)
    expect(prisma.user1.upsert).not.toHaveBeenCalled()
  })

  it('keeps the existing role when the Google email already has an account', async () => {
    const existingUser = {
      ...testUser,
      role: 'BUYER' as const,
    }
    vi.mocked(prisma.user1.upsert).mockResolvedValue(existingUser)
    const { authorizationUrl } = await startOidcSession()
    const pkceSessionToken = authorizationUrl.searchParams.get('state')
    if (!pkceSessionToken) throw new Error('Expected an OAuth state value.')

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id_token: 'google-id-token' }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            aud: 'test-client-id',
            iss: 'https://accounts.google.com',
            sub: 'google-user-id',
            email: testUser.email,
            email_verified: true,
            exp: String(Math.floor(Date.now() / 1000) + 3600),
            nonce: authorizationUrl.searchParams.get('nonce'),
          }),
          { status: 200 }
        )
      )

    const response = await execute(exchangeAuthCodeMutation, {
      pkceSessionToken,
      authorizationCode: 'authorization-code',
    })
    const result = (await response.json()) as ExchangeAuthCodeResponse

    expect(result.errors).toBeUndefined()
    expect(result.data?.exchangeAuthCode?.user.role).toBe('BUYER')
    expect(prisma.user1.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ role: 'SALES_ENGINEER' }),
        update: {},
      })
    )
  })
})
