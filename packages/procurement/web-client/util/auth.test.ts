import type { UserRole } from '@types-gen-react-apollo'
import { describe, expect, it } from 'vitest'
import { getRoleHomePath, isUserRole } from './auth'

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
