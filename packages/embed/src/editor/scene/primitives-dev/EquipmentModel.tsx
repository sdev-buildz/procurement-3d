import type { ThreeEvent } from '@react-three/fiber'
import type { MeshStandardMaterialParameters } from 'three'
import type { LayoutItem } from '../../items'
import { getEquipment } from '../../items'
import { EquipmentMeshes } from './EquipmentMeshes'

/** Renders one equipment item with its selection and violation indicators. */
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
  const equipment = item.item
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
        // This object is selected
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.025, 0]}
          renderOrder={1}
        >
          {/* If selected, highlights the model by displaying a ring around the object at its bottom. */}
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
        // There is a rule violation with this object.
        <>
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.035, 0]}
            renderOrder={2}
          >
            {/* The object is highlighted with a ring around the object at its bottom. */}
            <ringGeometry args={[0.78, 0.86, 48]} />
            <meshBasicMaterial
              color='#ff6577'
              transparent
              opacity={0.96}
              side={2}
              depthWrite={false}
            />
          </mesh>
          <mesh
            position={[
              0,
              Math.max(
                equipment.height + 0.14,
                getEquipment('cabinet').height + 0.15
              ),
              0,
            ]}
            renderOrder={3}
          >
            {/* The object is also highlighted with a sphere above its top. */}
            <sphereGeometry args={[0.1, 16, 12]} />
            <meshBasicMaterial color='#ff6577' />
          </mesh>
        </>
      ) : null}

      {/* The actual object. */}
      <EquipmentMeshes
        item={item}
        ghost={ghost}
        materialProps={materialProps}
      />
    </group>
  )
}
