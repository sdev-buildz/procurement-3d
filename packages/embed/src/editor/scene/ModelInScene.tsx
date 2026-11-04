import { type ComponentProps } from 'react'
import type { StrictOmit } from 'ts-strict-utils'
import { type ItemType, type LayoutItem } from '../items'
import { NestedInstances } from './NestedInstances'

/**
 * Places all the instances of a item type. Handles preload, nested load, etc...
 */
export const ModelInScene = (
  props: StrictOmit<
    ComponentProps<typeof NestedInstances>,
    'itemType' | 'itemsToInstance'
  > & {
    items: LayoutItem[]
  }
) => {
  const { items } = props

  const visited: Array<ItemType['id']> = []
  console.log(1, items)
  // Iterate through all the items in scene. Including duplicate instances
  return items.map((item) => {
    const itemType = item.item

    if (!itemType.models[0]?.url) return <></>

    // If the item is a duplicate instance of already visited item, skip
    if (visited.includes(itemType.id)) return <></>
    visited.push(itemType.id)

    // For instancing, get all the duplicate instances of the item from the scene.
    const instancesInScene = items.filter(
      (item) => item.item.id === itemType.id
    )
    console.log(2, items, instancesInScene)

    return (
      <NestedInstances
        {...props}
        itemsToInstance={instancesInScene}
        itemType={itemType}
        isRoot={true}
      />
    )
  })
}
