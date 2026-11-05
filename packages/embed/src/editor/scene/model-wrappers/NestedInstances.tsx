import { Suspense, type ComponentProps } from 'react'
import type { InstancedMeshGroup } from './InstancedMeshComp'
import { InstancedPlaceholderBox } from './InstancedPlaceholderBox'
import { LodComp } from './LodComp'

/**
 *  Nested loaders with instanced models.
 */
export function NestedInstances(
  props: ComponentProps<typeof InstancedMeshGroup> & {
    isRoot?: boolean
  }
) {
  const { itemType, isRoot, ghost, sizeIdx = 0 } = props
  let models = itemType.models

  if (!models?.length) {
    console.warn('No model url is provided to load.')
    return <></>
  }

  models = models?.toSorted((a, b) => a.size - b.size)

  if (isRoot) {
    console.log('isRoot suspense')
    // Display the wireframe bounding box placeholder as the initial placeholder
    return (
      // Suspense displays wireframe placeholder.
      <Suspense
        fallback={
          <InstancedPlaceholderBox
            items={props.itemsToInstance}
            itemType={itemType}
            ghost={ghost ?? false}
          />
        }
      >
        <NestedInstances {...props} isRoot={false} />
      </Suspense>
    )
  }

  // It is already nested. So display the lowest sized model as Suspence fallback, while loading higher sized models inside the suspense.
  if (sizeIdx === models.length - 1) {
    // Leaf node. only one model to load.
    return <LodComp {...props} maxSizeIdx={sizeIdx} />
  }

  if (sizeIdx < models.length - 1) {
    console.log(sizeIdx)
    // Not leaf node.
    return (
      <Suspense fallback={<LodComp {...props} maxSizeIdx={sizeIdx} />}>
        <NestedInstances {...props} isRoot={false} sizeIdx={sizeIdx + 1} />
      </Suspense>
    )
  }
}
