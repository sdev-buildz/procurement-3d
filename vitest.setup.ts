// import { clientHandles } from '@packages/common-utils/mocks'
import { beforeAll, beforeEach, vi } from 'vitest'

beforeAll(() => {
  vi.useFakeTimers()
})

beforeEach((context) => {
  vi.clearAllMocks()
})
