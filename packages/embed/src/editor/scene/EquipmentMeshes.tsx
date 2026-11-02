import { useEffect, useState } from 'react'
import type { Group, MeshStandardMaterialParameters } from 'three'
import { Box3, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { LayoutItem } from '../items'
import { EQUIPMENT } from '../items'

const PanelModel = ({
  equipment,
  materialProps,
}: {
  equipment: (typeof EQUIPMENT)['panel']
  materialProps: MeshStandardMaterialParameters
}) => (
  <>
    <mesh position={[0, equipment.height / 2, 0]} castShadow>
      <boxGeometry
        args={[equipment.width, equipment.height, equipment.depth]}
      />
      <meshStandardMaterial {...materialProps} />
    </mesh>
    <mesh position={[0, equipment.height * 0.61, equipment.depth / 2 + 0.009]}>
      <boxGeometry
        args={[equipment.width * 0.72, equipment.height * 0.38, 0.02]}
      />
      <meshStandardMaterial color='#17232e' metalness={0.4} />
    </mesh>
    {[-0.14, 0, 0.14].map((offset) => (
      <mesh
        key={offset}
        position={[
          offset,
          equipment.height * 0.62,
          equipment.depth / 2 + 0.025,
        ]}
      >
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial
          color='#b6ffab'
          emissive='#65e88b'
          emissiveIntensity={1.4}
        />
      </mesh>
    ))}
  </>
)

const DriveModel = ({
  equipment,
  materialProps,
}: {
  equipment: (typeof EQUIPMENT)['drive']
  materialProps: MeshStandardMaterialParameters
}) => (
  <>
    <mesh position={[0, equipment.height * 0.43, 0]} castShadow>
      <boxGeometry
        args={[
          equipment.width * 0.76,
          equipment.height * 0.78,
          equipment.depth * 0.76,
        ]}
      />
      <meshStandardMaterial {...materialProps} />
    </mesh>
    <mesh position={[0, equipment.height * 0.27, equipment.depth * 0.39]}>
      <boxGeometry args={[equipment.width * 0.38, 0.22, 0.025]} />
      <meshStandardMaterial color='#15242d' metalness={0.45} />
    </mesh>
    <mesh position={[0.16, equipment.height * 0.28, equipment.depth * 0.41]}>
      <sphereGeometry args={[0.035, 12, 12]} />
      <meshStandardMaterial
        color='#b6ffab'
        emissive='#65e88b'
        emissiveIntensity={1.5}
      />
    </mesh>
  </>
)

const CabinetModel = ({
  equipment,
  materialProps,
}: {
  equipment: (typeof EQUIPMENT)['cabinet']
  materialProps: MeshStandardMaterialParameters
}) => (
  <>
    <mesh position={[0, equipment.height / 2, 0]} castShadow>
      <boxGeometry
        args={[equipment.width, equipment.height, equipment.depth]}
      />
      <meshStandardMaterial {...materialProps} />
    </mesh>
    <mesh position={[0, equipment.height / 2, equipment.depth / 2 + 0.008]}>
      <boxGeometry
        args={[equipment.width * 0.82, equipment.height * 0.86, 0.018]}
      />
      <meshStandardMaterial color='#202d3b' metalness={0.5} />
    </mesh>
    <mesh
      position={[
        equipment.width * 0.31,
        equipment.height / 2,
        equipment.depth / 2 + 0.025,
      ]}
    >
      <boxGeometry args={[0.035, 0.36, 0.025]} />
      <meshStandardMaterial color='#aec3d1' metalness={0.75} />
    </mesh>
  </>
)

const glbCache = new Map<string, Promise<Group>>()

function getModelUrl(type: LayoutItem['type']): string | null {
  switch (type) {
    case 'carConcept':
      return new URL('../../util/models/CarConcept.glb', import.meta.url).href
    case 'commercialRefrigerator':
      return new URL(
        '../../util/models/CommercialRefrigerator.glb',
        import.meta.url
      ).href
    case 'sheenChair':
      return new URL('../../util/models/SheenChair.glb', import.meta.url).href
    case 'diffuseTransmissionTeacup':
      return new URL(
        '../../util/models/DiffuseTransmissionTeacup.glb',
        import.meta.url
      ).href
    default:
      return null
  }
}

const GlbModel = ({
  equipment,
  modelUrl,
  ghost = false,
}: {
  equipment: (typeof EQUIPMENT)[Exclude<
    keyof typeof EQUIPMENT,
    'drive' | 'cabinet' | 'panel'
  >]
  modelUrl: string
  ghost?: boolean
}) => {
  const [scene, setScene] = useState<Group | null>(null)

  useEffect(() => {
    let cancelled = false
    let load = glbCache.get(modelUrl)
    if (!load) {
      load = new GLTFLoader().loadAsync(modelUrl).then((gltf) => gltf.scene)
      glbCache.set(modelUrl, load)
    }
    void load
      .then((loadedScene) => {
        if (cancelled) return
        const clonedScene = loadedScene.clone(true)
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
        setScene(clonedScene)
      })
      .catch((error: unknown) => {
        console.error(`Failed to load model ${modelUrl}`, error)
      })

    return () => {
      cancelled = true
    }
  }, [equipment, modelUrl])

  return scene ? (
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
      <primitive object={scene} />
    </group>
  ) : (
    <mesh position={[0, equipment.height / 2, 0]}>
      <boxGeometry
        args={[equipment.width, equipment.height, equipment.depth]}
      />
      <meshStandardMaterial
        color={equipment.color}
        transparent
        opacity={ghost ? 0.34 : 0.45}
        wireframe={!ghost}
      />
    </mesh>
  )
}

/** Renders the equipment item */
export function EquipmentMeshes({
  item,
  ghost,
  materialProps,
}: {
  item: LayoutItem
  ghost: boolean
  materialProps: MeshStandardMaterialParameters
}) {
  if (item.type === 'drive') {
    return (
      <DriveModel equipment={EQUIPMENT.drive} materialProps={materialProps} />
    )
  }
  if (item.type === 'cabinet') {
    return (
      <CabinetModel
        equipment={EQUIPMENT.cabinet}
        materialProps={materialProps}
      />
    )
  }
  if (item.type === 'panel') {
    return (
      <PanelModel equipment={EQUIPMENT.panel} materialProps={materialProps} />
    )
  }

  return (
    <GlbModel
      modelUrl={getModelUrl(item.type) ?? ''}
      equipment={EQUIPMENT[item.type]}
      ghost={ghost}
    />
  )
}
