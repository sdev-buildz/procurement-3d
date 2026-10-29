import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCurrentUser } from './currentUser'

vi.mock('@packages/web-app-utils/shared', () => ({
  sharedConfig: {
    graphqlEndpoint: 'https://localhost:443/api/graphql',
  },
}))

describe('fetchCurrentUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns public user data when the token is accepted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        data: {
          me: {
            id: '7',
            email: 'sales1@example.test',
            role: 'SALES_ENGINEER',
          },
        },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCurrentUser('host-token')).resolves.toEqual({
      id: '7',
      email: 'sales1@example.test',
      role: 'SALES_ENGINEER',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      graphqlEndpoint,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer host-token',
        }),
      })
    )
  })

  it('returns null when the API does not yield a valid user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ data: { me: null } }),
      })
    )

    await expect(fetchCurrentUser('expired-token')).resolves.toBeNull()
  })
})
