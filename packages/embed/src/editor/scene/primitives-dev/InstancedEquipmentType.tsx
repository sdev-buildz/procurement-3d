import type { ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { InstancedMesh } from 'three'
import { Matrix4, Quaternion, Vector3 } from 'three'
import type { LayoutItem } from '../../items'
import { getEquipment } from '../../items'

function worldMatrix(
  item: LayoutItem,
  localX: number,
  localY: number,
  localZ: number
) {
  // Equipment yaw is stored in degrees, so convert it before rotating from local to world space.
  const yaw = (item.rotation * Math.PI) / 180
  const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw)
  // Transform the detail offset with the item's yaw; this keeps fronts and accents facing outward.
  const localPosition = new Vector3(localX, localY, localZ).applyQuaternion(
    rotation
  )
  const position = new Vector3(item.x, 0, item.z).add(localPosition)

  return new Matrix4().compose(position, rotation, new Vector3(1, 1, 1))
}

function floorMatrix(item: LayoutItem, localY: number) {
  // Ring geometry is initially horizontal on the XY plane; rotate it so it lies on the floor's XZ plane.
  return new Matrix4().compose(
    new Vector3(item.x, localY, item.z),
    new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2),
    new Vector3(1, 1, 1)
  )
}

function setInstancePointer(
  event: ThreeEvent<PointerEvent>,
  items: LayoutItem[],
  callback: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
) {
  // React Three Fiber supplies instanceId for the mesh copy that received the event, not its model ID.
  if (event.instanceId === undefined) return
  const item = items[event.instanceId]
  if (item) callback(item, event)
}

/** Renders one equipment type with its instanced scene details. */
export function InstancedEquipmentType({
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
  // Each ref represents one instanced mesh layer. Three.js updates these layers from matrices each layout pass.
  const bodyRef = useRef<InstancedMesh>(null)
  const violationBodyRef = useRef<InstancedMesh>(null)
  const detailRef = useRef<InstancedMesh>(null)
  const accentRef = useRef<InstancedMesh>(null)
  const selectedRef = useRef<InstancedMesh>(null)
  const violationRef = useRef<InstancedMesh>(null)
  const warningRef = useRef<InstancedMesh>(null)
  const equipment = getEquipment(type)

  useLayoutEffect(() => {
    // Update all matrices before paint so instances move together without a visible frame of stale transforms.
    const body = bodyRef.current
    // Normal and violating bodies are separate meshes, so each status can use a distinct material.
    const normalItems = items.filter((item) => !violationIds.has(item.id))
    if (body) {
      normalItems.forEach((item, index) => {
        let matrix: Matrix4
        // Drives sit on their base, while cabinets and panels are centered on their full body height.
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
          // One panel instance expands into three indicator spheres, at fixed offsets across its front.
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

    // Selection and violation rings reuse floor matrices so they remain flat and do not inherit equipment yaw.
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
            Math.max(
              equipment.height + 0.14,
              getEquipment('cabinet').height + 0.15
            ),
            0
          )
        )
      })
      warning.instanceMatrix.needsUpdate = true
      warning.computeBoundingBox()
      warning.computeBoundingSphere()
    }
  }, [items, selectedIds, violationIds, type, equipment])

  // Mesh details share pointerProps because they cover the same item list by original array index.
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
  // Body meshes have fewer instances than the full list, so translate each local instanceId through a filtered list.
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
