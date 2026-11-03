import type { MeshStandardMaterialParameters } from 'three'
import type { ItemType, LayoutItem } from '../items'
import { GlbModel } from './GlbModel'

const PanelModel = ({
  equipment,
  materialProps,
}: {
  equipment: ItemType
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
  equipment: ItemType
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
  equipment: ItemType
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
  const equipment = item.item
  const modelUrl = equipment.models[0]?.url ?? ''

  if (modelUrl === '') {
    if (equipment.name === 'drive') {
      return <DriveModel equipment={equipment} materialProps={materialProps} />
    }
    if (equipment.name === 'cabinet') {
      return (
        <CabinetModel equipment={equipment} materialProps={materialProps} />
      )
    }
    return <PanelModel equipment={equipment} materialProps={materialProps} />
  }

  return (
    <GlbModel
      models={equipment.models}
      equipment={equipment}
      isRoot={true}
      ghost={ghost}
    />
  )
}
