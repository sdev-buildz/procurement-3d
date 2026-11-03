import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { LayoutItem } from '../items'
import { getEquipment } from '../items'

/** Renders selection and violation indicators for instanced GLTF equipment. */
export function InstancedMeshIndicators({
  items,
  selectedIds,
  violationIds,
}: {
  items: LayoutItem[]
  selectedIds: Set<string>
  violationIds: Set<string>
}) {
  const selectedItems = items.filter((item) => selectedIds.has(item.id))
  const violatingItems = items.filter((item) => violationIds.has(item.id))
  const selectedRef = useRef<THREE.InstancedMesh>(null)
  const violationRingRef = useRef<THREE.InstancedMesh>(null)
  const warningRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const updateInstances = (
      mesh: THREE.InstancedMesh | null,
      instances: LayoutItem[],
      positionForItem: (item: LayoutItem) => THREE.Vector3,
      rotation: THREE.Euler
    ) => {
      if (!mesh) return
      const dummy = new THREE.Object3D()
      dummy.rotation.copy(rotation)

      instances.forEach((item, index) => {
        dummy.position.copy(positionForItem(item))
        dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)
      })

      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingBox()
      mesh.computeBoundingSphere()
    }

    updateInstances(
      selectedRef.current,
      selectedItems,
      (item) => new THREE.Vector3(item.x, 0.025, item.z),
      new THREE.Euler(-Math.PI / 2, 0, 0)
    )
    updateInstances(
      violationRingRef.current,
      violatingItems,
      (item) => new THREE.Vector3(item.x, 0.035, item.z),
      new THREE.Euler(-Math.PI / 2, 0, 0)
    )
    updateInstances(
      warningRef.current,
      violatingItems,
      (item) =>
        new THREE.Vector3(
          item.x,
          Math.max(
            item.item.height + 0.14,
            getEquipment('cabinet').height + 0.15
          ),
          item.z
        ),
      new THREE.Euler()
    )
  }, [selectedItems, violatingItems])

  return (
    <>
      {selectedItems.length ? (
        <instancedMesh
          ref={selectedRef}
          args={[undefined, undefined, selectedItems.length]}
          renderOrder={1}
        >
          <ringGeometry args={[0.64, 0.69, 48]} />
          <meshBasicMaterial
            color='#a5f3e1'
            transparent
            opacity={0.88}
            side={2}
          />
        </instancedMesh>
      ) : null}
      {violatingItems.length ? (
        <>
          <instancedMesh
            ref={violationRingRef}
            args={[undefined, undefined, violatingItems.length]}
            renderOrder={2}
          >
            <ringGeometry args={[0.78, 0.86, 48]} />
            <meshBasicMaterial
              color='#ff6577'
              transparent
              opacity={0.96}
              side={2}
              depthWrite={false}
            />
          </instancedMesh>
          <instancedMesh
            ref={warningRef}
            args={[undefined, undefined, violatingItems.length]}
            renderOrder={3}
          >
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshBasicMaterial color='#ff6577' />
          </instancedMesh>
        </>
      ) : null}
    </>
  )
}
