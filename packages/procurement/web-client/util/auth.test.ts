import type { UserRole } from '@types-gen-react-apollo'
import { describe, expect, it, vi } from 'vitest'
import { clearLogoutData, getRoleHomePath, isUserRole } from './auth'

describe('role home routes', () => {
  it.each([
    ['BUYER', '/buyer'],
    ['SUPPLIER', '/supplier'],
    ['SALES_ENGINEER', '/sales-engineer'],
    ['ADMIN', '/admin'],
  ] as Array<[UserRole, string]>)('maps %s to %s', (role, path) => {
    expect(getRoleHomePath(role)).toBe(path)
    expect(isUserRole(role)).toBe(true)
  })

  it('rejects unknown roles', () => {
    expect(isUserRole('UNKNOWN')).toBe(false)
  })
})

describe('logout cleanup', () => {
  it('clears browser storage and the Apollo cache', async () => {
    const localStorage = {
      clear: vi.fn(),
    } as unknown as Storage
    const sessionStorage = {
      clear: vi.fn(),
    } as unknown as Storage
    const cacheClient = {
      clearStore: vi.fn().mockResolvedValue(undefined),
    }

    await clearLogoutData({
      localStorage,
      sessionStorage,
      cacheClient,
    })

    expect(localStorage.clear).toHaveBeenCalledOnce()
    expect(sessionStorage.clear).toHaveBeenCalledOnce()
    expect(cacheClient.clearStore).toHaveBeenCalledOnce()
  })
})
