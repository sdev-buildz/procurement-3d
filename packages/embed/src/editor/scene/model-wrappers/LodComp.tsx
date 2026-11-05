import { Detailed } from '@react-three/drei'
import { useContext, type ComponentProps } from 'react'
import { RoomContext } from '../context'
import { InstancedMeshGroup } from './InstancedMeshComp'
import type { NestedInstances } from './NestedInstances'

/**
 *  Nested loaders with instanced models.
 */
export function LodComp(
  props: ComponentProps<typeof NestedInstances> & { maxSizeIdx: number }
) {
  const { lodBound } = useContext(RoomContext)
  const { itemType } = props
  const models = itemType.models.toSorted((a, b) => a.size - b.size)

  if (!models?.length) {
    console.warn('No model url is provided to load.')
    return <></>
  }

  /** The distance at which the lowest sized model is shown */
  const maxDistance: number = 4

  /** The distance delta at which the model is switched */
  const distanceDelta = 20 / (models.length - lodBound - 1)

  /** The distances at which the model is switched. */
  const distances: number[] = [0]

  for (let i = 0; i < maxDistance / distanceDelta; i += 1) {
    distances.push(distanceDelta * (i + 1))
  }

  return (
    <Detailed distances={distances}>
      {Array.from({ length: Math.max(1, props.maxSizeIdx + 1 - lodBound) }).map(
        (_, idx) => {
          const modelIdx = Math.max(props.maxSizeIdx - idx - lodBound, 0)
          return (
            <InstancedMeshGroup
              key={models[modelIdx]?.id}
              {...props}
              sizeIdx={modelIdx}
            />
          )
        }
      )}
    </Detailed>
  )
}
