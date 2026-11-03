import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getEquipment, ROOM } from '../items'

/**
 * Instanced Pot and Coals
 */
export function InstancedPotAndCoals({ count = 500 }) {
  // 1. Destructure the exact nodes and materials from your file
  const { nodes, materials } = useGLTF(
    getEquipment('potOfCoals').models[0]!.url
  )

  // 2. Create independent refs for each instancedMesh
  const coalsRef = useRef<THREE.InstancedMesh>(null!)
  const potRef = useRef<THREE.InstancedMesh>(null!)

  useEffect(() => {
    if (!coalsRef.current || !potRef.current) return

    const dummy = new THREE.Object3D()
    dummy.scale.set(5, 5, 5)
    dummy.rotateX(-Math.PI / 2)

    const minx = -ROOM.width / 2
    const maxx = ROOM.width / 2
    const minz = -ROOM.depth / 2

    let x = minx,
      z = minz
    for (let i = 0; i < count; i++) {
      // Generate identical positions/rotations for both parts so they stay grouped
      // const x = (Math.random() - 0.5) * 15
      if (x < maxx) x += 0.5
      else {
        x = minx
        z += 0.5
      }
      const y = 0

      dummy.position.set(x, y, z)
      dummy.updateMatrix()

      // Apply the exact same matrix to both meshes
      coalsRef.current.setMatrixAt(i, dummy.matrix)
      potRef.current.setMatrixAt(i, dummy.matrix)
    }

    coalsRef.current.computeBoundingBox()
    coalsRef.current.computeBoundingSphere()
    potRef.current.computeBoundingBox()
    potRef.current.computeBoundingSphere()
    // Notify Three.js that the matrices have updated
    coalsRef.current.instanceMatrix.needsUpdate = true
    potRef.current.instanceMatrix.needsUpdate = true
  }, [count])

  return (
    <group>
      {/* Instanced Mesh for the Hot Coals */}
      <instancedMesh
        ref={coalsRef}
        args={[
          (nodes.HotCoals! as THREE.Mesh).geometry,
          materials.HotCoals,
          count,
        ]}
      />

      {/* Instanced Mesh for the Copper Pot */}
      <instancedMesh
        ref={potRef}
        args={[
          (nodes.CopperPot! as THREE.Mesh).geometry,
          materials.CopperPot,
          count,
        ]}
      />
    </group>
  )
}
