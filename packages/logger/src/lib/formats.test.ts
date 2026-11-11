import { describe, expect, it, vi } from 'vitest'
import { createElapsedTimeFormat } from './formats'

describe('createElapsedTimeFormat', () => {
  it('adds elapsed time between log entries without relying on format context', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const elapsedTimeFormat = createElapsedTimeFormat()

    const first = elapsedTimeFormat.transform({
      level: 'info',
      message: 'first',
    })
    vi.advanceTimersByTime(25)
    const second = elapsedTimeFormat.transform({
      level: 'info',
      message: 'second',
    })

    expect(first).toMatchObject({ ms: '+0ms' })
    expect(second).toMatchObject({ ms: '+25ms' })
  })
})
