import { Suspense, type ComponentProps } from 'react'
import { Placeholder } from './GlbModel'
import { InstancedMeshGroup } from './InstancedMeshComp'

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

  models = models?.sort((a, b) => a.size - b.size)

  if (isRoot) {
    console.log('isRoot suspense')
    // Display the wireframe bounding box placeholder as the initial placeholder
    return (
      // Suspense displays wireframe placeholder.
      <Suspense
        fallback={<Placeholder equipment={itemType} ghost={ghost ?? false} />}
      >
        <NestedInstances {...props} isRoot={false} />
      </Suspense>
    )
  }

  // It is already nested. So display the lowest sized model as Suspence fallback, while loading higher sized models inside the suspense.
  if (sizeIdx === models.length - 1) {
    // Leaf node. only one model to load.
    return <InstancedMeshGroup {...props} sizeIdx={sizeIdx} />
  }

  if (sizeIdx < models.length - 1) {
    console.log(sizeIdx)
    // Not leaf node.
    return (
      <Suspense fallback={<InstancedMeshGroup {...props} sizeIdx={sizeIdx} />}>
        <NestedInstances {...props} isRoot={false} sizeIdx={sizeIdx + 1} />
      </Suspense>
    )
  }
}
