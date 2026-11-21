import type { LayoutItem } from '../items'

/** Returns the world-space anchor for a scene item label. */
export function getSceneItemLabelPosition(
  item: LayoutItem,
  topDown: boolean
): [number, number, number] {
  const xOffset = topDown
    ? (Math.abs(Math.cos((item.rotation * Math.PI) / 180)) * item.item.width +
        Math.abs(Math.sin((item.rotation * Math.PI) / 180)) * item.item.depth) /
        2 +
      0.25
    : 0

  return [item.x + xOffset, item.item.height + 0.2, item.z]
}
