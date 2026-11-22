import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Vector3 } from 'three'
import type { LayoutItem } from '../items'
import { getVisibleLabelIds } from './labelVisibility'
import { getSceneItemLabelPosition } from './labelPosition'

/**
 * Label text on top of every item in the scene.
 */
export function SceneItemLabels({
  items,
  selectedIds,
  violationIds,
  topDown,
}: {
  items: LayoutItem[]
  selectedIds: Set<string>
  violationIds: Set<string>
  topDown: boolean
}) {
  const elapsed = useRef(0)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set())

  useFrame(({ camera, size }, delta) => {
    elapsed.current += delta
    if (elapsed.current < 0.15) return
    elapsed.current = 0

    const labels = items.flatMap((item) => {
      const position = new Vector3(
        ...getSceneItemLabelPosition(item, topDown)
      ).project(camera)
      if (position.z < -1 || position.z > 1) return []

      const centerX = (position.x * 0.5 + 0.5) * size.width
      const centerY = (-position.y * 0.5 + 0.5) * size.height
      const width = Math.max(40, item.label.length * 6.5 + 16)
      const height = 20
      if (
        centerX + width / 2 < 0 ||
        centerX - width / 2 > size.width ||
        centerY + height / 2 < 0 ||
        centerY - height / 2 > size.height
      ) {
        return []
      }
      return [
        {
          id: item.id,
          left: centerX - width / 2,
          top: centerY - height / 2,
          right: centerX + width / 2,
          bottom: centerY + height / 2,
          priority: selectedIds.has(item.id)
            ? 2
            : violationIds.has(item.id)
              ? 1
              : 0,
        },
      ]
    })
    const nextVisibleIds = getVisibleLabelIds(labels)
    setVisibleIds((current) => {
      if (
        current.size === nextVisibleIds.size &&
        [...current].every((id) => nextVisibleIds.has(id))
      ) {
        return current
      }
      return nextVisibleIds
    })
  })

  return (
    <>
      {items.map((item) =>
        visibleIds.has(item.id) ? (
          <Html
            key={item.id}
            position={getSceneItemLabelPosition(item, topDown)}
            center
            className='ce-scene-label-anchor'
            pointerEvents='none'
            style={{ pointerEvents: 'none' }}
            zIndexRange={[20, 0]}
          >
            <div className='ce-scene-label'>{item.label}</div>
          </Html>
        ) : null
      )}
    </>
  )
}
