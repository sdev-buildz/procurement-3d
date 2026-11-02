import { EQUIPMENT, type LayoutItem } from '../items'

const minimumClearanceMeters = 0.6

/** A pair of equipment whose footprint boundary clearance violates the spacing rule. */
export type RuleViolation = {
  /** First item in the violating pair. */
  first: LayoutItem
  /** Second item in the violating pair. */
  second: LayoutItem
  /** Shortest distance between the item footprint boundaries, in meters. */
  distance: number
}

/**
 * Finds all item pairs with less than 0.6 meters of footprint-to-footprint clearance.
 * @param items - Current room layout.
 * @returns Each violating pair and its measured boundary clearance.
 */
export function findRuleViolations(items: LayoutItem[]): RuleViolation[] {
  const violations: RuleViolation[] = []

  for (let firstIndex = 0; firstIndex < items.length; firstIndex += 1) {
    const first = items[firstIndex]
    if (!first) continue

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < items.length;
      secondIndex += 1
    ) {
      const second = items[secondIndex]
      if (!second) continue

      const firstEquipment = EQUIPMENT[first.type]
      const secondEquipment = EQUIPMENT[second.type]
      const firstRotated = Math.abs(first.rotation % 180) === 90
      const secondRotated = Math.abs(second.rotation % 180) === 90
      const firstWidth = firstRotated
        ? firstEquipment.depth
        : firstEquipment.width
      const firstDepth = firstRotated
        ? firstEquipment.width
        : firstEquipment.depth
      const secondWidth = secondRotated
        ? secondEquipment.depth
        : secondEquipment.width
      const secondDepth = secondRotated
        ? secondEquipment.width
        : secondEquipment.depth
      const gapX = Math.max(
        Math.abs(first.x - second.x) - (firstWidth + secondWidth) / 2,
        0
      )
      const gapZ = Math.max(
        Math.abs(first.z - second.z) - (firstDepth + secondDepth) / 2,
        0
      )
      const distance = Math.hypot(gapX, gapZ)
      if (distance < minimumClearanceMeters - 1e-9) {
        violations.push({ first, second, distance })
      }
    }
  }

  return violations
}

/**
 * A hook that returns the current tule violations in the layout based on the items displayed.
 */
export const useViolations = (itemsDisplayed: LayoutItem[]) => {
  const violations = findRuleViolations(itemsDisplayed)

  return violations
}
