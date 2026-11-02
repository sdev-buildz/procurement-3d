import type { LayoutItem } from './items'
import { EQUIPMENT, ROOM } from './items'

/** Small starting layout that demonstrates the three catalog types. */
export const initialLayout: LayoutItem[] = [
  { id: 'drive-1', type: 'drive', x: -5, z: -1.5, rotation: 0 },
  { id: 'cabinet-1', type: 'cabinet', x: 0, z: -1.5, rotation: 0 },
  { id: 'panel-1', type: 'panel', x: 5, z: 1.5, rotation: 0 },
]

/**
 * Rounds a coordinate to the nearest fixed-grid cell.
 * @param value - Coordinate in meters.
 * @returns The nearest coordinate on the room grid.
 */
export function snapToGrid(value: number): number {
  return Math.round(value / ROOM.cellSize) * ROOM.cellSize
}

/**
 * Snaps a proposed transform to the grid and keeps the model footprint in bounds.
 * @param item - Equipment whose dimensions and rotation define its footprint.
 * @param x - Proposed X coordinate in meters.
 * @param z - Proposed Z coordinate in meters.
 * @returns The valid, snapped center coordinates.
 */
export function constrainPosition(
  /** Equipment footprint to constrain. */
  item: LayoutItem,
  /** Proposed X coordinate in meters. */
  x: number,
  /** Proposed Z coordinate in meters. */
  z: number
): Pick<LayoutItem, 'x' | 'z'> {
  const { width, depth } = EQUIPMENT[item.type]
  const rotated = Math.abs(item.rotation % 180) === 90
  const halfWidth = (rotated ? depth : width) / 2
  const halfDepth = (rotated ? width : depth) / 2
  const minX = Math.ceil((-ROOM.width / 2 + halfWidth) / ROOM.cellSize)
  const maxX = Math.floor((ROOM.width / 2 - halfWidth) / ROOM.cellSize)
  const minZ = Math.ceil((-ROOM.depth / 2 + halfDepth) / ROOM.cellSize)
  const maxZ = Math.floor((ROOM.depth / 2 - halfDepth) / ROOM.cellSize)

  // Clamp cell indices so equipment footprints stay in bounds without breaking the grid.
  return {
    x:
      Math.min(maxX, Math.max(minX, Math.round(x / ROOM.cellSize))) *
      ROOM.cellSize,
    z:
      Math.min(maxZ, Math.max(minZ, Math.round(z / ROOM.cellSize))) *
      ROOM.cellSize,
  }
}
