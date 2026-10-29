/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable jsdoc/require-jsdoc */
import { logger } from '@packages/logger'
import crypto from 'node:crypto'
import { serverConfig } from '../serverConfig.ts'

const IV_LEN = 12
const TAG_LEN = 16

/**
 * Decode the configured key explicitly and assert it is 32 bytes for AES-256.
 * The encoding must match how the key is stored ('utf8' | 'base64' | 'hex').
 */
function resolveKey(jweKey: string, encoding: BufferEncoding): Buffer {
  const key = Buffer.from(jweKey, encoding)
  if (key.length !== 32) {
    throw new Error(
      `Invalid JWE key: expected 32 bytes for AES-256, got ${key.length} (encoding=${encoding})`
    )
  }
  return key
}

const key = resolveKey(serverConfig.auth.jweKey, 'utf8' as BufferEncoding)

export function encryptJwe(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  // Layout: [ IV (12) | AuthTag (16) | Ciphertext ]
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64')
}
const a = 'j+4y81S/l0CYbcn+ckd3RhBYH8hU8t3hDqhWWiI+Y8s3JAHE2tE='
export function decryptJwe(encryptedBase64: string): string | null {
  if (encryptedBase64.toLowerCase().startsWith('bearer '))
    encryptedBase64 = encryptedBase64.slice('Bearer '.length)

  const inputBuffer = Buffer.from(encryptedBase64, 'base64')

  // Guard against truncated/garbage input before touching crypto.
  if (inputBuffer.length < IV_LEN + TAG_LEN) {
    logger.error('Decryption failed: token too short')
    return null
  }

  const iv = inputBuffer.subarray(0, IV_LEN)
  const authTag = inputBuffer.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const ciphertext = inputBuffer.subarray(IV_LEN + TAG_LEN) // pass Buffer directly

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8')
    return plaintext
  } catch (error) {
    // Auth failure (tampered/corrupted) or any crypto error -> null
    logger.error(
      'Decryption failed: invalid authentication tag or corrupted token'
    )
    return null
  }
}
