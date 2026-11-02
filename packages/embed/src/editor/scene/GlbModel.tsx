import { useGLTF } from '@react-three/drei'
import { Suspense, useMemo } from 'react'
import type { Group } from 'three'
import { Box3, Vector3 } from 'three'
import type { ItemType } from '../items'

/**
 * Wireframe placeholder until the model loads.
 * In nested loaders, it can be displayed before the lowest quality model is loaded.
 */
const Placeholder = ({
  equipment,
  ghost,
}: {
  equipment: ItemType
  ghost: boolean
}) => (
  <mesh position={[0, equipment.height / 2, 0]}>
    <boxGeometry args={[equipment.width, equipment.height, equipment.depth]} />
    <meshStandardMaterial
      color={equipment.color}
      transparent
      opacity={ghost ? 0.34 : 0.45}
      wireframe={!ghost}
    />
  </mesh>
)

/**
 * Loads, resizes, and renders a GLB model.
 */
const LoadedGlbModel = ({
  equipment,
  modelUrl,
  ghost,
}: {
  equipment: ItemType
  modelUrl: string
  ghost: boolean
}) => {
  const { scene } = useGLTF(modelUrl)

  /**
   * Scaled down version of the loaded model to fit into our equipment's dimensions.
   * For example, if the open source 3D model is 30 meters wide (bigger than our scene's grid), it scales the model down.
   */
  const normalizedScene = useMemo(() => {
    const clonedScene = (scene as Group).clone(true)
    clonedScene.traverse((object) => {
      if ('isMesh' in object) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })

    const bounds = new Box3().setFromObject(clonedScene)
    const size = bounds.getSize(new Vector3())
    const dimensions = [
      equipment.width / Math.max(size.x, 0.001),
      equipment.height / Math.max(size.y, 0.001),
      equipment.depth / Math.max(size.z, 0.001),
    ]
    if (dimensions.every((dimension) => Number.isFinite(dimension))) {
      clonedScene.scale.setScalar(Math.min(...dimensions))
    }

    const normalizedBounds = new Box3().setFromObject(clonedScene)
    const center = normalizedBounds.getCenter(new Vector3())
    clonedScene.position.set(-center.x, -normalizedBounds.min.y, -center.z)
    return clonedScene
  }, [scene, equipment.width, equipment.height, equipment.depth])

  return (
    <group
      onPointerOver={(event) => {
        console.log(
          'pointer-over document.body.style.cursor =',
          document.body.style.cursor
        )
        event.stopPropagation()
        if (!ghost) document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!ghost) document.body.style.cursor = ''
      }}
    >
      <primitive object={normalizedScene} />
    </group>
  )
}

/**
 * Loads and renders a GLB model.
 */
export const GlbModel = ({
  equipment,
  modelUrl,
  ghost = false,
}: {
  equipment: ItemType
  modelUrl: string
  ghost?: boolean
}) => (
  <Suspense fallback={<Placeholder equipment={equipment} ghost={ghost} />}>
    <LoadedGlbModel equipment={equipment} modelUrl={modelUrl} ghost={ghost} />
  </Suspense>
)
