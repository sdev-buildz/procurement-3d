import { afterEach, describe, expect, it, vi } from 'vitest'
import { decryptJwe, encryptJwe } from './jwe'

describe('JWE helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reads the JWE secret when encrypting and decrypting', () => {
    vi.stubEnv('JWE_KEY', 'a'.repeat(32))

    const encrypted = encryptJwe('payload')

    expect(decryptJwe(encrypted)).toBe('payload')
  })
})
