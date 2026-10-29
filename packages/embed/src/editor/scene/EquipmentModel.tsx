import type { ThreeEvent } from '@react-three/fiber'
import type { MeshStandardMaterialParameters } from 'three'
import type { LayoutItem } from '../types'
import { EQUIPMENT } from '../types'

const PanelModel = ({
  equipment,
  materialProps,
}: {
  equipment: (typeof EQUIPMENT)['panel']
  materialProps: MeshStandardMaterialParameters
}) => {
  return (
    <>
      <mesh position={[0, equipment.height / 2, 0]} castShadow>
        <boxGeometry
          args={[equipment.width, equipment.height, equipment.depth]}
        />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh
        position={[0, equipment.height * 0.61, equipment.depth / 2 + 0.009]}
      >
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
}
const DriveModel = ({
  equipment,
  materialProps,
}: {
  equipment: (typeof EQUIPMENT)['drive']
  materialProps: MeshStandardMaterialParameters
}) => {
  return (
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
}

const CabinetModel = ({
  equipment,
  materialProps,
}: {
  equipment: (typeof EQUIPMENT)['cabinet']
  materialProps: MeshStandardMaterialParameters
}) => {
  return (
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
}

/**
 * The 3D models of electrical drives and cabinets.
 */
export function EquipmentModel({
  item,
  selected,
  violation,
  ghost = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  item: LayoutItem
  selected: boolean
  violation: boolean
  ghost?: boolean
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void
  onPointerMove?: (event: ThreeEvent<PointerEvent>) => void
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void
  onPointerCancel?: (event: ThreeEvent<PointerEvent>) => void
}) {
  const equipment = EQUIPMENT[item.type]
  const color = violation ? '#ff6577' : equipment.color
  const materialProps: MeshStandardMaterialParameters = {
    color,
    roughness: 0.48,
    metalness: 0.32,
    transparent: ghost,
    opacity: ghost ? 0.34 : 1,
    emissive: violation ? '#8c1024' : selected ? color : '#000000',
    emissiveIntensity: violation ? 0.55 : selected ? 0.16 : 0,
  }

  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, (item.rotation * Math.PI) / 180, 0]}
      {...(onPointerDown ? { onPointerDown } : {})}
      {...(onPointerMove ? { onPointerMove } : {})}
      {...(onPointerUp ? { onPointerUp } : {})}
      {...(onPointerCancel ? { onPointerCancel } : {})}
      onPointerOver={(event) => {
        event.stopPropagation()
        if (!ghost) document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!ghost) document.body.style.cursor = ''
      }}
    >
      {selected && !ghost ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.025, 0]}
          renderOrder={1}
        >
          <ringGeometry args={[0.64, 0.69, 48]} />
          <meshBasicMaterial
            color='#a5f3e1'
            transparent
            opacity={0.88}
            side={2}
          />
        </mesh>
      ) : null}
      {violation && !ghost ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.035, 0]}
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
        </mesh>
      ) : null}
      {violation && !ghost ? (
        <mesh
          position={[
            0,
            Math.max(equipment.height + 0.14, EQUIPMENT.cabinet.height + 0.15),
            0,
          ]}
          renderOrder={3}
        >
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshBasicMaterial color='#ff6577' />
        </mesh>
      ) : null}
      {item.type === 'drive' ? (
        <DriveModel
          equipment={equipment as (typeof EQUIPMENT)['drive']}
          materialProps={materialProps}
        />
      ) : item.type === 'cabinet' ? (
        <CabinetModel
          equipment={equipment as (typeof EQUIPMENT)['cabinet']}
          materialProps={materialProps}
        />
      ) : (
        <PanelModel
          equipment={equipment as (typeof EQUIPMENT)['panel']}
          materialProps={materialProps}
        />
      )}
    </group>
  )
}
