import { type ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { type ItemType, type LayoutItem } from '../items'

/**
 * Wireframe placeholder until the model loads.
 * In nested loaders, it can be displayed before the lowest quality model is loaded.
 */
export const InstancedPlaceholderBox = ({
  items,
  itemType,
  ghost,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  items: LayoutItem[]
  itemType: ItemType
  ghost: boolean
  onPointerDown?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerMove?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerUp?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerCancel?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const count = items.length

  const geometry = useMemo(
    () =>
      new THREE.BoxGeometry(itemType.width, itemType.height, itemType.depth),
    [itemType.width, itemType.height, itemType.depth]
  )
  const material = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: itemType.color,
        transparent: true,
        opacity: ghost ? 0.34 : 0.45,
        wireframe: !ghost,
      }),
    [itemType.color, ghost]
  )

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const mesh = meshRef.current
    if (!mesh) return

    for (let index = 0; index < count; index += 1) {
      const item = items[index]!
      dummy.position.set(item.x, itemType.height / 2, item.z)
      dummy.rotation.set(0, (item.rotation * Math.PI) / 180, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }

    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
    mesh.instanceMatrix.needsUpdate = true
  }, [count, itemType.height, items])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material]
  )

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      {...(onPointerDown
        ? {
            onPointerDown: (event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation()
              if (typeof event.instanceId !== 'number') return
              onPointerDown(items[event.instanceId]!, event)
            },
          }
        : {})}
      {...(onPointerMove
        ? {
            onPointerMove: (event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation()
              if (typeof event.instanceId !== 'number') return
              onPointerMove(items[event.instanceId]!, event)
            },
          }
        : {})}
      {...(onPointerUp
        ? {
            onPointerUp: (event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation()
              if (typeof event.instanceId !== 'number') return
              onPointerUp(items[event.instanceId]!, event)
            },
          }
        : {})}
      {...(onPointerCancel
        ? {
            onPointerCancel: (event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation()
              if (typeof event.instanceId !== 'number') return
              onPointerCancel(items[event.instanceId]!, event)
            },
          }
        : {})}
    />
  )
}
