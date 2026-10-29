import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { ThreeEvent } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import { EQUIPMENT, ROOM } from '../types'
import type { EquipmentType, LayoutItem } from '../types'

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

function EquipmentModel({
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
  const materialProps = {
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
          <mesh
            position={[0.16, equipment.height * 0.28, equipment.depth * 0.41]}
          >
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial
              color='#b6ffab'
              emissive='#65e88b'
              emissiveIntensity={1.5}
            />
          </mesh>
        </>
      ) : item.type === 'cabinet' ? (
        <>
          <mesh position={[0, equipment.height / 2, 0]} castShadow>
            <boxGeometry
              args={[equipment.width, equipment.height, equipment.depth]}
            />
            <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh
            position={[0, equipment.height / 2, equipment.depth / 2 + 0.008]}
          >
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
      ) : (
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
      )}
    </group>
  )
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
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{
        position: topDown ? [0, 23, 0.01] : [14, 12, 16],
        fov: topDown ? 39 : 42,
        near: 0.1,
        far: 100,
      }}
      onPointerMissed={onClearSelection}
    >
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

      {items.map((item) => (
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
  )
}
