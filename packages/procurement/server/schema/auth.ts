import { prisma } from '@packages/db/prisma'
import { encryptJwe } from '@packages/web-app-utils'
import { GraphQLError } from 'graphql'
import { scrypt, timingSafeEqual } from 'node:crypto'
import { builder } from './lib/builder'

// eslint-disable-next-line @typescript-eslint/naming-convention
const HASH_SIZE = 64
// eslint-disable-next-line @typescript-eslint/naming-convention
const DUMMY_SALT = '00000000000000000000000000000000'
// eslint-disable-next-line @typescript-eslint/naming-convention
const DUMMY_HASH = Buffer.alloc(HASH_SIZE)

type LoginResult = {
  token: string
  user: {
    id: number
    email: string
    role: 'BUYER' | 'SUPPLIER' | 'SALES_ENGINEER' | 'ADMIN'
  }
}

const UserRole = builder.enumType('UserRole', {
  values: ['BUYER', 'SUPPLIER', 'SALES_ENGINEER', 'ADMIN'] as const,
})

const UserRef = builder.objectRef<LoginResult['user']>('LoginUser').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    role: t.field({
      type: UserRole,
      resolve: (user) => user.role,
    }),
  }),
})

const LoginResultRef = builder.objectRef<LoginResult>('LoginResult').implement({
  fields: (t) => ({
    token: t.exposeString('token'),
    user: t.field({
      type: UserRef,
      resolve: ({ user }) => user,
    }),
  }),
})

const derivePasswordHash = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, HASH_SIZE, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(derivedKey)
    })
  })

builder.mutationField('login', (t) =>
  t.field({
    type: LoginResultRef,
    description: 'Authenticate with an email and password.',
    args: {
      email: t.arg.string({ required: true }),
      password: t.arg.string({ required: true }),
    },
    resolve: async (_parent, { email, password }) => {
      const user = await prisma.user1.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          salt: true,
          role: true,
        },
      })

      const saltIsValid = user !== null && /^[\da-f]{32}$/i.test(user.salt)
      const hashIsValid =
        user !== null && /^[\da-f]{128}$/i.test(user.passwordHash)
      const salt = saltIsValid ? user.salt : DUMMY_SALT
      const expectedHash =
        hashIsValid && user ? Buffer.from(user.passwordHash, 'hex') : DUMMY_HASH
      const actualHash = await derivePasswordHash(password, salt)

      if (
        !user ||
        !saltIsValid ||
        !hashIsValid ||
        !timingSafeEqual(actualHash, expectedHash)
      ) {
        throw new GraphQLError('Invalid email or password.')
      }

      return {
        token: encryptJwe(JSON.stringify({ id: String(user.id) })),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      }
    },
  })
)
