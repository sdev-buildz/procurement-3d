import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { getEquipment, type LayoutItem } from '../items'
import { useDrag } from './useDrag'

const items: LayoutItem[] = [
  { id: 'drive-1', item: getEquipment('drive'), x: 0, z: 0, rotation: 0 },
]

describe('useDrag', () => {
  it('previews constrained movement and commits it when dragging ends', () => {
    const onCommit = vi.fn()
    const onPositionChange = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    let dragState: ReturnType<typeof useDrag> | undefined
    const Harness = () => {
      dragState = useDrag({
        items,
        onCommit,
        onPositionChange,
      })
      return null
    }

    act(() => root.render(createElement(Harness)))
    act(() => {
      dragState?.dragHandlers.onStart('drive-1')
      dragState?.dragHandlers.onMove('drive-1', 1.24, 1.76)
    })

    expect(dragState?.dragPreview).toMatchObject({ x: 1, z: 2 })

    act(() => dragState?.dragHandlers.onEnd('drive-1'))

    expect(dragState?.dragPreview).toBeNull()
    expect(onCommit).toHaveBeenCalledWith([{ ...items[0], x: 1, z: 2 }])
    expect(onPositionChange).toHaveBeenCalledWith({
      ...items[0],
      x: 1,
      z: 2,
    })

    act(() => root.unmount())
  })

  it('does not commit when drag ends without a position change', () => {
    const onCommit = vi.fn()
    const onPositionChange = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    let dragState: ReturnType<typeof useDrag> | undefined
    const Harness = () => {
      dragState = useDrag({
        items,
        onCommit,
        onPositionChange,
      })
      return null
    }

    act(() => root.render(createElement(Harness)))
    act(() => {
      dragState?.dragHandlers.onStart('drive-1')
      dragState?.dragHandlers.onEnd('drive-1')
    })

    expect(onCommit).not.toHaveBeenCalled()
    expect(onPositionChange).not.toHaveBeenCalled()

    act(() => root.unmount())
  })
})
