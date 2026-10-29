import type { ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { InstancedMesh, MeshStandardMaterialParameters } from 'three'
import { Matrix4, Quaternion, Vector3 } from 'three'
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

function worldMatrix(
  item: LayoutItem,
  localX: number,
  localY: number,
  localZ: number
) {
  const yaw = (item.rotation * Math.PI) / 180
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw)
  const localPosition = new Vector3(localX, localY, localZ).applyQuaternion(
    rotation
  )
  const position = new Vector3(item.x, 0, item.z).add(localPosition)

  return new Matrix4().compose(position, rotation, new Vector3(1, 1, 1))
}

function floorMatrix(item: LayoutItem, localY: number) {
  return new Matrix4().compose(
    new Vector3(item.x, localY, item.z),
    new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2),
    new Vector3(1, 1, 1)
  )
}

/**
 * The 3D models of electrical drives and cabinets, rendered as instanced meshes for performance.
 */
export function InstancedEquipmentModels({
  items,
  selectedIds,
  violationIds,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  items: LayoutItem[]
  selectedIds: Set<string>
  violationIds: Set<string>
  onPointerDown: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerMove: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void
  onPointerCancel: (event: ThreeEvent<PointerEvent>) => void
}) {
  const types = ['drive', 'cabinet', 'panel'] as const

  return (
    <>
      {types.map((type) => {
        const typeItems = items.filter((item) => item.type === type)
        return typeItems.length ? (
          <InstancedEquipmentType
            key={type}
            type={type}
            items={typeItems}
            selectedIds={selectedIds}
            violationIds={violationIds}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          />
        ) : null
      })}
    </>
  )
}

function setInstancePointer(
  event: ThreeEvent<PointerEvent>,
  items: LayoutItem[],
  callback: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
) {
  if (event.instanceId === undefined) return
  const item = items[event.instanceId]
  if (item) callback(item, event)
}

function InstancedEquipmentType({
  type,
  items,
  selectedIds,
  violationIds,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  type: 'drive' | 'cabinet' | 'panel'
  items: LayoutItem[]
  selectedIds: Set<string>
  violationIds: Set<string>
  onPointerDown: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerMove: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void
  onPointerCancel: (event: ThreeEvent<PointerEvent>) => void
}) {
  const bodyRef = useRef<InstancedMesh>(null)
  const violationBodyRef = useRef<InstancedMesh>(null)
  const detailRef = useRef<InstancedMesh>(null)
  const accentRef = useRef<InstancedMesh>(null)
  const selectedRef = useRef<InstancedMesh>(null)
  const violationRef = useRef<InstancedMesh>(null)
  const warningRef = useRef<InstancedMesh>(null)
  const equipment = EQUIPMENT[type]

  useLayoutEffect(() => {
    const body = bodyRef.current
    const normalItems = items.filter((item) => !violationIds.has(item.id))
    if (body) {
      normalItems.forEach((item, index) => {
        let matrix: Matrix4
        if (type === 'drive') {
          matrix = worldMatrix(item, 0, equipment.height * 0.43, 0)
        } else {
          matrix = worldMatrix(item, 0, equipment.height / 2, 0)
        }
        body.setMatrixAt(index, matrix)
      })
      body.instanceMatrix.needsUpdate = true
      body.computeBoundingBox()
      body.computeBoundingSphere()
    }

    const violationBody = violationBodyRef.current
    if (violationBody) {
      const violatingItems = items.filter((item) => violationIds.has(item.id))
      violatingItems.forEach((item, index) => {
        const localY =
          type === 'drive' ? equipment.height * 0.43 : equipment.height / 2
        violationBody.setMatrixAt(index, worldMatrix(item, 0, localY, 0))
      })
      violationBody.instanceMatrix.needsUpdate = true
      violationBody.computeBoundingBox()
      violationBody.computeBoundingSphere()
    }

    const detail = detailRef.current
    if (detail) {
      items.forEach((item, index) => {
        const localY =
          type === 'drive'
            ? equipment.height * 0.27
            : type === 'cabinet'
              ? equipment.height / 2
              : equipment.height * 0.61
        const localZ =
          type === 'drive'
            ? equipment.depth * 0.39
            : type === 'cabinet'
              ? equipment.depth / 2 + 0.008
              : equipment.depth / 2 + 0.009
        detail.setMatrixAt(index, worldMatrix(item, 0, localY, localZ))
      })
      detail.instanceMatrix.needsUpdate = true
      detail.computeBoundingBox()
      detail.computeBoundingSphere()
    }

    const accent = accentRef.current
    if (accent) {
      items.forEach((item, index) => {
        if (type === 'panel') {
          for (const [lightIndex, offset] of [-0.14, 0, 0.14].entries()) {
            accent.setMatrixAt(
              index * 3 + lightIndex,
              worldMatrix(
                item,
                offset,
                equipment.height * 0.62,
                equipment.depth / 2 + 0.025
              )
            )
          }
        } else if (type === 'drive') {
          accent.setMatrixAt(
            index,
            worldMatrix(
              item,
              0.16,
              equipment.height * 0.28,
              equipment.depth * 0.41
            )
          )
        } else {
          accent.setMatrixAt(
            index,
            worldMatrix(
              item,
              equipment.width * 0.31,
              equipment.height / 2,
              equipment.depth / 2 + 0.025
            )
          )
        }
      })
      accent.instanceMatrix.needsUpdate = true
      accent.computeBoundingBox()
      accent.computeBoundingSphere()
    }

    const selectedItems = items.filter((item) => selectedIds.has(item.id))
    const selected = selectedRef.current
    if (selected) {
      selectedItems.forEach((item, index) => {
        selected.setMatrixAt(index, floorMatrix(item, 0.025))
      })
      selected.instanceMatrix.needsUpdate = true
      selected.computeBoundingBox()
      selected.computeBoundingSphere()
    }

    const violatingItems = items.filter((item) => violationIds.has(item.id))
    const violationRing = violationRef.current
    if (violationRing) {
      violatingItems.forEach((item, index) => {
        violationRing.setMatrixAt(index, floorMatrix(item, 0.035))
      })
      violationRing.instanceMatrix.needsUpdate = true
      violationRing.computeBoundingBox()
      violationRing.computeBoundingSphere()
    }
    const warning = warningRef.current
    if (warning) {
      violatingItems.forEach((item, index) => {
        warning.setMatrixAt(
          index,
          worldMatrix(
            item,
            0,
            Math.max(equipment.height + 0.14, EQUIPMENT.cabinet.height + 0.15),
            0
          )
        )
      })
      warning.instanceMatrix.needsUpdate = true
      warning.computeBoundingBox()
      warning.computeBoundingSphere()
    }
  }, [items, selectedIds, violationIds, type, equipment])

  const pointerProps = {
    onPointerDown: (event: ThreeEvent<PointerEvent>) =>
      setInstancePointer(event, items, onPointerDown),
    onPointerMove: (event: ThreeEvent<PointerEvent>) =>
      setInstancePointer(event, items, onPointerMove),
    onPointerUp,
    onPointerCancel,
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      document.body.style.cursor = 'grab'
    },
    onPointerOut: () => {
      document.body.style.cursor = ''
    },
  }
  const normalItems = items.filter((item) => !violationIds.has(item.id))
  const violatingItems = items.filter((item) => violationIds.has(item.id))
  const normalPointerProps = {
    ...pointerProps,
    onPointerDown: (event: ThreeEvent<PointerEvent>) =>
      setInstancePointer(event, normalItems, onPointerDown),
    onPointerMove: (event: ThreeEvent<PointerEvent>) =>
      setInstancePointer(event, normalItems, onPointerMove),
  }
  const violationPointerProps = {
    ...pointerProps,
    onPointerDown: (event: ThreeEvent<PointerEvent>) =>
      setInstancePointer(event, violatingItems, onPointerDown),
    onPointerMove: (event: ThreeEvent<PointerEvent>) =>
      setInstancePointer(event, violatingItems, onPointerMove),
  }
  const selectedCount = items.filter((item) => selectedIds.has(item.id)).length
  const violatingCount = items.filter((item) =>
    violationIds.has(item.id)
  ).length
  const normalCount = items.length - violatingCount

  if (type === 'cabinet') {
    return (
      <>
        {normalCount ? (
          <instancedMesh
            ref={bodyRef}
            args={[undefined, undefined, normalCount]}
            frustumCulled
            castShadow
            {...normalPointerProps}
          >
            <boxGeometry
              args={[equipment.width, equipment.height, equipment.depth]}
            />
            <meshStandardMaterial
              color={equipment.color}
              roughness={0.48}
              metalness={0.32}
            />
          </instancedMesh>
        ) : null}
        {violatingCount ? (
          <instancedMesh
            ref={violationBodyRef}
            args={[undefined, undefined, violatingCount]}
            frustumCulled
            castShadow
            {...violationPointerProps}
          >
            <boxGeometry
              args={[equipment.width, equipment.height, equipment.depth]}
            />
            <meshStandardMaterial
              color='#ff6577'
              roughness={0.48}
              metalness={0.32}
            />
          </instancedMesh>
        ) : null}
        <instancedMesh
          ref={detailRef}
          args={[undefined, undefined, items.length]}
          {...pointerProps}
        >
          <boxGeometry
            args={[equipment.width * 0.82, equipment.height * 0.86, 0.018]}
          />
          <meshStandardMaterial color='#202d3b' metalness={0.5} />
        </instancedMesh>
        <instancedMesh
          ref={accentRef}
          args={[undefined, undefined, items.length]}
          {...pointerProps}
        >
          <boxGeometry args={[0.035, 0.36, 0.025]} />
          <meshStandardMaterial color='#aec3d1' metalness={0.75} />
        </instancedMesh>
        {selectedCount ? (
          <instancedMesh
            ref={selectedRef}
            args={[undefined, undefined, selectedCount]}
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
        {violatingCount ? (
          <>
            <instancedMesh
              ref={violationRef}
              args={[undefined, undefined, violatingCount]}
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
              args={[undefined, undefined, violatingCount]}
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

  if (type === 'drive') {
    return (
      <>
        {normalCount ? (
          <instancedMesh
            ref={bodyRef}
            args={[undefined, undefined, normalCount]}
            frustumCulled
            castShadow
            {...normalPointerProps}
          >
            <boxGeometry
              args={[
                equipment.width * 0.76,
                equipment.height * 0.78,
                equipment.depth * 0.76,
              ]}
            />
            <meshStandardMaterial
              color={equipment.color}
              roughness={0.48}
              metalness={0.32}
            />
          </instancedMesh>
        ) : null}
        {violatingCount ? (
          <instancedMesh
            ref={violationBodyRef}
            args={[undefined, undefined, violatingCount]}
            frustumCulled
            castShadow
            {...violationPointerProps}
          >
            <boxGeometry
              args={[
                equipment.width * 0.76,
                equipment.height * 0.78,
                equipment.depth * 0.76,
              ]}
            />
            <meshStandardMaterial
              color='#ff6577'
              roughness={0.48}
              metalness={0.32}
            />
          </instancedMesh>
        ) : null}
        <instancedMesh
          ref={detailRef}
          args={[undefined, undefined, items.length]}
          {...pointerProps}
        >
          <boxGeometry args={[equipment.width * 0.38, 0.22, 0.025]} />
          <meshStandardMaterial color='#15242d' metalness={0.45} />
        </instancedMesh>
        <instancedMesh
          ref={accentRef}
          args={[undefined, undefined, items.length]}
          {...pointerProps}
        >
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial
            color='#b6ffab'
            emissive='#65e88b'
            emissiveIntensity={1.5}
          />
        </instancedMesh>
        {selectedCount ? (
          <instancedMesh
            ref={selectedRef}
            args={[undefined, undefined, selectedCount]}
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
        {violatingCount ? (
          <>
            <instancedMesh
              ref={violationRef}
              args={[undefined, undefined, violatingCount]}
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
              args={[undefined, undefined, violatingCount]}
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

  return (
    <>
      {normalCount ? (
        <instancedMesh
          ref={bodyRef}
          args={[undefined, undefined, normalCount]}
          frustumCulled
          castShadow
          {...normalPointerProps}
        >
          <boxGeometry
            args={[equipment.width, equipment.height, equipment.depth]}
          />
          <meshStandardMaterial
            color={equipment.color}
            roughness={0.48}
            metalness={0.32}
          />
        </instancedMesh>
      ) : null}
      {violatingCount ? (
        <instancedMesh
          ref={violationBodyRef}
          args={[undefined, undefined, violatingCount]}
          frustumCulled
          castShadow
          {...violationPointerProps}
        >
          <boxGeometry
            args={[equipment.width, equipment.height, equipment.depth]}
          />
          <meshStandardMaterial
            color='#ff6577'
            roughness={0.48}
            metalness={0.32}
          />
        </instancedMesh>
      ) : null}
      <instancedMesh
        ref={detailRef}
        args={[undefined, undefined, items.length]}
        {...pointerProps}
      >
        <boxGeometry
          args={[equipment.width * 0.72, equipment.height * 0.38, 0.02]}
        />
        <meshStandardMaterial color='#17232e' metalness={0.4} />
      </instancedMesh>
      <instancedMesh
        ref={accentRef}
        args={[undefined, undefined, items.length * 3]}
      >
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial
          color='#b6ffab'
          emissive='#65e88b'
          emissiveIntensity={1.4}
        />
      </instancedMesh>
      {selectedCount ? (
        <instancedMesh
          ref={selectedRef}
          args={[undefined, undefined, selectedCount]}
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
      {violatingCount ? (
        <>
          <instancedMesh
            ref={violationRef}
            args={[undefined, undefined, violatingCount]}
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
            args={[undefined, undefined, violatingCount]}
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
