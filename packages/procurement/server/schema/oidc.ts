import { sharedConfig } from '@packages/web-app-utils'
import { encryptJwe } from '@packages/web-app-utils/node/yoga-node/jwe'
import { GraphQLError } from 'graphql'
import { createHash, randomBytes, scrypt } from 'node:crypto'
import { LoginResultRef } from './auth'
import { builder } from './lib/builder'

type PkceSession = {
  codeVerifier: string
  nonce: string
  expiresAt: number
}

const pkceSessions = new Map<string, PkceSession>()
const pkceSessionTtlMs = 10 * 60 * 1000
const googleOauth2AuthorizationEndpoint =
  'https://accounts.google.com/o/oauth2/v2/auth'
const googleOauth2TokenEndpoint = 'https://oauth2.googleapis.com/token'
const googleOauth2TokenInfoEndpoint = 'https://oauth2.googleapis.com/tokeninfo'

type OidcInitResType = {
  authorizationUrl: string
}

const OidcInitResRef = builder
  .objectRef<OidcInitResType>('OidcInitRes')
  .implement({
    fields: (t) => ({
      authorizationUrl: t.exposeString('authorizationUrl'),
    }),
  })

builder.mutationField('oidcInit', (t) =>
  t.field({
    type: OidcInitResRef,
    description:
      'Provide an authorization URL and PKCE values for the Google sign-in button.',
    resolve: () => {
      const clientId = process.env.GOOGLE_OAUTH2_CLIENT_ID
      if (!clientId) {
        throw new GraphQLError('Google OAuth is not configured.')
      }

      const now = Date.now()
      for (const [token, session] of pkceSessions) {
        if (session.expiresAt <= now) pkceSessions.delete(token)
      }

      const codeVerifier = randomBytes(32).toString('base64url')
      const codeChallenge = createHash('sha256')
        .update(codeVerifier)
        .digest('base64url')
      const nonce = randomBytes(32).toString('base64url')
      const pkceSessionToken = randomBytes(32).toString('base64url')

      pkceSessions.set(pkceSessionToken, {
        codeVerifier,
        nonce,
        expiresAt: now + pkceSessionTtlMs,
      })

      const authorizationUrl = new URL(googleOauth2AuthorizationEndpoint)
      authorizationUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: sharedConfig.webClientOrigin,
        response_type: 'code',
        scope: 'openid email profile',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        nonce,
        state: pkceSessionToken,
      }).toString()

      return {
        authorizationUrl: authorizationUrl.toString(),
      }
    },
  })
)

builder.mutationField('exchangeAuthCode', (t) =>
  t.field({
    type: LoginResultRef,
    description: 'Exchange a Google authorization code and log in the user.',
    args: {
      pkceSessionToken: t.arg.string({ required: true }),
      authorizationCode: t.arg.string({ required: true }),
    },
    resolve: async (
      _parent,
      { authorizationCode, pkceSessionToken },
      context
    ) => {
      const pkceSession = pkceSessions.get(pkceSessionToken)
      if (!pkceSession || pkceSession.expiresAt <= Date.now()) {
        pkceSessions.delete(pkceSessionToken)
        throw new GraphQLError(
          'The sign-in session is invalid or expired. Please try again.'
        )
      }

      pkceSessions.delete(pkceSessionToken)

      const clientId = process.env.GOOGLE_OAUTH2_CLIENT_ID
      const clientSecret = process.env.GOOGLE_OAUTH2_CLIENT_SECRET
      if (!clientId || !clientSecret) {
        throw new GraphQLError('Google OAuth is not configured.')
      }

      const response = await fetch(googleOauth2TokenEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: authorizationCode,
          code_verifier: pkceSession.codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: sharedConfig.webClientOrigin,
        }),
      })

      if (!response.ok) {
        throw new GraphQLError('Google rejected the authorization code.')
      }

      const tokenResponse: unknown = await response.json()
      if (
        typeof tokenResponse !== 'object' ||
        tokenResponse === null ||
        !('id_token' in tokenResponse) ||
        typeof tokenResponse.id_token !== 'string'
      ) {
        throw new GraphQLError('Google returned an invalid token response.')
      }

      const tokenInfoUrl = new URL(googleOauth2TokenInfoEndpoint)
      tokenInfoUrl.searchParams.set('id_token', tokenResponse.id_token)
      const tokenInfoResponse = await fetch(tokenInfoUrl)
      if (!tokenInfoResponse.ok) {
        throw new GraphQLError('Google returned an invalid ID token.')
      }

      const tokenInfo: unknown = await tokenInfoResponse.json()
      if (
        typeof tokenInfo !== 'object' ||
        tokenInfo === null ||
        !('aud' in tokenInfo) ||
        tokenInfo.aud !== clientId ||
        !('iss' in tokenInfo) ||
        (tokenInfo.iss !== 'accounts.google.com' &&
          tokenInfo.iss !== 'https://accounts.google.com') ||
        !('sub' in tokenInfo) ||
        typeof tokenInfo.sub !== 'string' ||
        !tokenInfo.sub ||
        !('email' in tokenInfo) ||
        typeof tokenInfo.email !== 'string' ||
        !('email_verified' in tokenInfo) ||
        (tokenInfo.email_verified !== true &&
          tokenInfo.email_verified !== 'true') ||
        !('exp' in tokenInfo) ||
        !Number.isFinite(Number(tokenInfo.exp)) ||
        Number(tokenInfo.exp) <= Math.floor(Date.now() / 1000) ||
        !('nonce' in tokenInfo) ||
        tokenInfo.nonce !== pkceSession.nonce
      ) {
        throw new GraphQLError('Google returned an invalid ID token.')
      }

      const givenName =
        'given_name' in tokenInfo && typeof tokenInfo.given_name === 'string'
          ? tokenInfo.given_name.trim()
          : ''
      const fullName =
        'name' in tokenInfo && typeof tokenInfo.name === 'string'
          ? tokenInfo.name.trim()
          : ''
      const profileName = givenName || fullName
      if (!profileName) {
        throw new GraphQLError('Google did not provide a name.')
      }

      const email = tokenInfo.email.trim().toLowerCase()
      if (!email) {
        throw new GraphQLError('Google did not provide a verified email.')
      }

      const salt = randomBytes(16).toString('hex')
      const randomPassword = randomBytes(32).toString('hex')
      const passwordHash = await new Promise<Buffer>((resolve, reject) => {
        scrypt(randomPassword, salt, 64, (error, derivedKey) => {
          if (error) {
            reject(error)
            return
          }
          resolve(derivedKey)
        })
      })

      const user = await context.prisma.user1.upsert({
        where: { email },
        create: {
          email,
          passwordHash: passwordHash.toString('hex'),
          salt,
          role: 'SALES_ENGINEER',
          salesProfile: {
            create: { name: profileName },
          },
        },
        update: {},
        select: {
          id: true,
          email: true,
          role: true,
        },
      })

      return {
        token: encryptJwe(JSON.stringify({ id: String(user.id) })),
        user,
      }
    },
  })
)
