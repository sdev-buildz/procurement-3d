import { A11yAnnouncer } from '@react-three/a11y'
import { Stats } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { EquipmentType, LayoutItem } from '../types'
import { ROOM } from '../types'
import { EquipmentModel, InstancedEquipmentModels } from './EquipmentModel'

type RoomSceneProps = {
  /** Current room equipment. */
  items: LayoutItem[]
  /** IDs highlighted as selected in the editor panels. */
  selectedIds: Set<string>
  /** IDs participating in an active spacing violation. */
  violationIds: Set<string>
  /** Suggested item transform rendered as a translucent ghost. */
  previewItem: LayoutItem | null
  /** Equipment category to place when the floor is clicked. */
  placementType: EquipmentType | null
  /** Whether to show the synchronized top-down camera. */
  topDown: boolean
  /** Selects an item, optionally extending the current selection. */
  onSelect: (id: string, extend: boolean) => void
  /** Clears the active selection. */
  onClearSelection: () => void
  /** Adds the active palette item at the clicked floor position. */
  onPlace: (x: number, z: number) => void
  /** Starts a pointer drag for one item. */
  onDragStart: (id: string) => void
  /** Updates a drag preview using the pointer's world coordinates. */
  onDrag: (id: string, x: number, z: number) => void
  /** Commits the final position after a pointer drag. */
  onDragEnd: (id: string) => void
}

function makeGridGeometry(): BufferGeometry {
  const points: number[] = []
  const addLine = (x1: number, z1: number, x2: number, z2: number) => {
    points.push(x1, 0.015, z1, x2, 0.015, z2)
  }

  for (let x = -ROOM.width / 2; x <= ROOM.width / 2; x += ROOM.cellSize) {
    addLine(x, -ROOM.depth / 2, x, ROOM.depth / 2)
  }
  for (let z = -ROOM.depth / 2; z <= ROOM.depth / 2; z += ROOM.cellSize) {
    addLine(-ROOM.width / 2, z, ROOM.width / 2, z)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(new Float32Array(points), 3)
  )
  return geometry
}

function makeWireGeometry(items: LayoutItem[]): BufferGeometry {
  const byId = new Map(items.map((item) => [item.id, item]))
  const points: number[] = []

  for (const item of items) {
    for (const connectionId of item.connections ?? []) {
      if (item.id >= connectionId) continue
      const connectedItem = byId.get(connectionId)
      if (!connectedItem) continue
      points.push(
        item.x,
        0.035,
        item.z,
        connectedItem.x,
        0.035,
        connectedItem.z
      )
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(new Float32Array(points), 3)
  )
  return geometry
}

function CameraControls({
  topDown,
  onControlsReady,
}: {
  topDown: boolean
  onControlsReady: (controls: OrbitControls | null) => void
}) {
  const { camera, gl } = useThree()

  useEffect(() => {
    camera.up.set(0, topDown ? 0 : 1, topDown ? -1 : 0)
    if (topDown) camera.position.set(0, 23, 0.01)
    else camera.position.set(14, 12, 16)
    camera.lookAt(0, 0, 0)
    const controls = new OrbitControls(camera, gl.domElement)
    controls.target.set(0, 0, 0)
    controls.enableRotate = !topDown
    controls.enableDamping = true
    controls.update()
    onControlsReady(controls)
    return () => {
      onControlsReady(null)
      controls.dispose()
    }
  }, [camera, gl, topDown])

  return null
}

/** Renders the room, equipment, selection, wire geometry, and preview state. */
export function RoomScene({
  items,
  selectedIds,
  violationIds,
  previewItem,
  placementType,
  topDown,
  onSelect,
  onClearSelection,
  onPlace,
  onDragStart,
  onDrag,
  onDragEnd,
}: RoomSceneProps) {
  const gridGeometry = useMemo(makeGridGeometry, [])
  const wireGeometry = useMemo(() => makeWireGeometry(items), [items])
  const draggingId = useRef<string | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  const handleItemDown = (
    item: LayoutItem,
    event: ThreeEvent<PointerEvent>
  ) => {
    event.stopPropagation()
    onSelect(item.id, event.nativeEvent.shiftKey)
    onDragStart(item.id)
    draggingId.current = item.id
    if (controlsRef.current) controlsRef.current.enabled = false
    document.body.style.cursor = 'grabbing'
  }
  const handleItemMove = (
    item: LayoutItem,
    event: ThreeEvent<PointerEvent>
  ) => {
    onDrag(item.id, event.point.x, event.point.z)
  }
  const handleItemUp = () => {
    const activeId = draggingId.current
    if (activeId) {
      onDragEnd(activeId)
      if (controlsRef.current) controlsRef.current.enabled = true
    }
    draggingId.current = null
    document.body.style.cursor = ''
  }

  return (
    <>
      <A11yAnnouncer />
      <Canvas
        shadows
        gl={{ localClippingEnabled: true }}
        dpr={[1, 1.5]}
        camera={{
          position: topDown ? [0, 23, 0.01] : [14, 12, 16],
          fov: topDown ? 39 : 42,
          near: 0.1,
          far: 100,
        }}
        onPointerMissed={onClearSelection}
      >
        <Stats />
        <color attach='background' args={['#101820']} />
        <ambientLight intensity={1.35} />
        <directionalLight
          position={[-5, 12, 7]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <CameraControls
          topDown={topDown}
          onControlsReady={(controls) => {
            controlsRef.current = controls
          }}
        />

        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.035, 0]}
          receiveShadow
          onPointerDown={(event) => {
            event.stopPropagation()
            if (placementType) onPlace(event.point.x, event.point.z)
            else onClearSelection()
          }}
          onPointerMove={(event) => {
            if (draggingId.current) {
              onDrag(draggingId.current, event.point.x, event.point.z)
            }
          }}
          onPointerUp={handleItemUp}
          onPointerCancel={handleItemUp}
        >
          <planeGeometry args={[ROOM.width, ROOM.depth]} />
          <meshStandardMaterial color='#202b34' roughness={0.9} />
        </mesh>
        <lineSegments geometry={gridGeometry}>
          <lineBasicMaterial color='#3a4954' transparent opacity={0.66} />
        </lineSegments>
        <lineSegments geometry={wireGeometry}>
          <lineBasicMaterial color='#75e6d1' transparent opacity={0.9} />
        </lineSegments>
        <mesh position={[0, 1.5, -ROOM.depth / 2]} receiveShadow>
          <boxGeometry args={[ROOM.width, 3, 0.12]} />
          <meshStandardMaterial color='#28343d' roughness={0.84} />
        </mesh>
        <mesh position={[-ROOM.width / 2, 1.5, 0]} receiveShadow>
          <boxGeometry args={[0.12, 3, ROOM.depth]} />
          <meshStandardMaterial color='#25313a' roughness={0.84} />
        </mesh>

        <InstancedEquipmentModels
          items={items}
          selectedIds={selectedIds}
          violationIds={violationIds}
          onPointerDown={(item, event) => handleItemDown(item, event)}
          onPointerMove={(item, event) => handleItemMove(item, event)}
          onPointerUp={handleItemUp}
          onPointerCancel={handleItemUp}
        />
        {items
          .filter(
            (item) =>
              item.type === 'carConcept' ||
              item.type === 'commercialRefrigerator' ||
              item.type === 'sheenChair' ||
              item.type === 'diffuseTransmissionTeacup'
          )
          .map((item) => (
            <EquipmentModel
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              violation={violationIds.has(item.id)}
              onPointerDown={(event) => handleItemDown(item, event)}
              onPointerMove={(event) => handleItemMove(item, event)}
              onPointerUp={handleItemUp}
              onPointerCancel={handleItemUp}
            />
          ))}
        {previewItem ? (
          <EquipmentModel
            item={previewItem}
            selected={false}
            violation={false}
            ghost
          />
        ) : null}
      </Canvas>
    </>
  )
}
