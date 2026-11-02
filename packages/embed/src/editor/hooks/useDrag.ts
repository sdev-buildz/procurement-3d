import { useRef, useState, type RefObject } from 'react'
import type { LayoutItem } from '../items'
import { constrainPosition } from '../layout'

/** Pointer callbacks that start, update, and finish an item drag. */
export type DragHandlers = {
  onStart: (id: string) => void
  onMove: (id: string, x: number, z: number) => void
  onEnd: (id: string) => void
}

type UseDragProps = {
  items: LayoutItem[]
  onCommit: (items: LayoutItem[]) => void
  onPositionChange: (item: LayoutItem) => void
}

/** Tracks a constrained drag preview and commits it when the drag ends. */
export function useDrag({ items, onCommit, onPositionChange }: UseDragProps): {
  draggedItem: RefObject<LayoutItem | null>
  dragPreview: LayoutItem | null
  dragHandlers: DragHandlers
} {
  const [dragPreview, setDragPreview] = useState<LayoutItem | null>(null)
  const draggedItem = useRef<LayoutItem | null>(null)

  const onStart = (id: LayoutItem['id']) => {
    draggedItem.current = items.find((item) => item.id === id) ?? null
  }

  const onMove = (id: LayoutItem['id'], x: number, z: number) => {
    const item = draggedItem.current
    if (!item || item.id !== id) return
    const next = { ...item, ...constrainPosition(item, x, z) }
    draggedItem.current = next
    setDragPreview(next)
  }

  const onEnd = (id: LayoutItem['id']) => {
    const moved = draggedItem.current
    draggedItem.current = null
    setDragPreview(null)
    if (!moved || moved.id !== id) return
    const original = items.find((item) => item.id === id)
    if (!original || (original.x === moved.x && original.z === moved.z)) return

    onCommit(items.map((item) => (item.id === id ? moved : item)))
    onPositionChange(moved)
  }

  return {
    draggedItem,
    dragPreview,
    dragHandlers: { onStart, onMove, onEnd },
  }
}
