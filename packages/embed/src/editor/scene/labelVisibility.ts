/** Projected screen-space bounds for one scene label. */
export type LabelRectangle = {
  id: string
  left: number
  top: number
  right: number
  bottom: number
  priority: number
}

const labelGap = 6
const gridSize = 64

/** Selects high-priority labels while suppressing labels that overlap on screen. */
export function getVisibleLabelIds(
  labels: readonly LabelRectangle[]
): Set<string> {
  const visible = new Set<string>()
  const occupiedCells = new Map<string, LabelRectangle[]>()
  const orderedLabels = [...labels].sort((first, second) =>
    second.priority === first.priority ? 0 : second.priority - first.priority
  )

  for (const label of orderedLabels) {
    const left = label.left - labelGap
    const top = label.top - labelGap
    const right = label.right + labelGap
    const bottom = label.bottom + labelGap
    const minCellX = Math.floor(left / gridSize)
    const maxCellX = Math.floor(right / gridSize)
    const minCellY = Math.floor(top / gridSize)
    const maxCellY = Math.floor(bottom / gridSize)
    let overlaps = false

    for (let cellX = minCellX; cellX <= maxCellX && !overlaps; cellX += 1) {
      for (let cellY = minCellY; cellY <= maxCellY && !overlaps; cellY += 1) {
        const cell = occupiedCells.get(`${cellX}:${cellY}`) ?? []
        overlaps = cell.some(
          (existing) =>
            label.left < existing.right + labelGap &&
            label.right > existing.left - labelGap &&
            label.top < existing.bottom + labelGap &&
            label.bottom > existing.top - labelGap
        )
      }
    }

    if (overlaps) continue
    visible.add(label.id)

    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
        const key = `${cellX}:${cellY}`
        const cell = occupiedCells.get(key) ?? []
        cell.push(label)
        occupiedCells.set(key, cell)
      }
    }
  }

  return visible
}
