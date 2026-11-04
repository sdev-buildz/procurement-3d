import type { ItemType, LayoutItem } from '../editor/items'

const ids = new Set<string>()

/**
 * Creates a unique id to be used on a {@link LayoutItem}.
 */
export function makeId(item: ItemType): string {
  let newId = `${item.name}-${crypto.randomUUID()}`
  while (ids.has(newId)) newId = `${item.name}-${crypto.randomUUID()}`
  ids.add(newId)
  return newId
}
