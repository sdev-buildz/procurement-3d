import { Detailed } from '@react-three/drei'
import { type ComponentProps } from 'react'
import { InstancedMeshGroup } from './InstancedMeshComp'
import type { NestedInstances } from './NestedInstances'

/**
 *  Nested loaders with instanced models.
 */
export function LodComp(
  props: ComponentProps<typeof NestedInstances> & { maxSizeIdx: number }
) {
  const { itemType } = props
  let models = itemType.models

  if (!models?.length) {
    console.warn('No model url is provided to load.')
    return <></>
  }

  models = models?.toSorted((a, b) => b.size - a.size)

  /** The distance at which the lowest sized model is shown */
  const maxDistance: number = 4

  /** The distance delta at which the model is switched */
  const distanceDelta = 20 / (models.length - 1)

  /** The distances at which the model is switched. */
  const distances: number[] = [0]

  for (let i = 0; i < maxDistance / distanceDelta; i += 1) {
    distances.push(distanceDelta * (i + 1))
  }
  return (
    <Detailed distances={distances}>
      {Array.from({ length: props.maxSizeIdx + 1 }).map((_, idx) => (
        <InstancedMeshGroup {...props} sizeIdx={props.maxSizeIdx - idx} />
      ))}
    </Detailed>
  )
}
