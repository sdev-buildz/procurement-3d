import { A11yAnnouncer } from '@react-three/a11y'
import { Stats } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ComponentProps } from 'react'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { RuleViolation } from '../hooks/useViolations'
import { type LayoutItem } from '../items'
import { EquipmentModel } from './EquipmentModel'
import { InstancedEquipmentModels } from './primitives-dev/InstancedEquipmentModels'
import { RoomBounds } from './RoomBounds'

type RoomSceneProps = {
  /** Current room equipment. */
  itemsDisplayed: LayoutItem[]
  /** IDs highlighted as selected in the editor panels. */
  selectedIds: Set<string>
  /** IDs participating in an active spacing violation. */
  violations: RuleViolation[]
  /** Suggested item transform rendered as a translucent ghost. */
  previewItem: LayoutItem | null
  /** Whether to show the synchronized top-down camera. */
  topDown: boolean
  /** Selects an item, optionally extending the current selection. */
  onSelect: (id: string, extend: boolean) => void
} & Omit<ComponentProps<typeof RoomBounds>, 'handleItemUp'>

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
  itemsDisplayed: items,
  selectedIds,
  violations,
  previewItem,
  topDown,
  onSelect,
  onClearSelection,
  itemPlaced,
  onPlace,
  dragHandlers,
  draggingId,
}: RoomSceneProps) {
  const controlsRef = useRef<OrbitControls | null>(null)
  const statsParentRef = useRef<HTMLDivElement>(null)
  const violationIds = useMemo(
    () =>
      new Set(violations.flatMap(({ first, second }) => [first.id, second.id])),
    [violations]
  )

  /** Handles pressing mouse button down on an object. */
  const handleItemDown = (
    item: LayoutItem,
    event: ThreeEvent<PointerEvent>
  ) => {
    event.stopPropagation()
    onSelect(item.id, event.nativeEvent.shiftKey)
    dragHandlers.onStart(item.id)
    if (controlsRef.current) controlsRef.current.enabled = false
    document.body.style.cursor = 'grabbing'
  }

  /** Handles moving the cursor while holding mouse button down on an object. */
  const handleItemMove = (
    item: LayoutItem,
    event: ThreeEvent<PointerEvent>
  ) => {
    dragHandlers.onMove(item.id, event.point.x, event.point.z)
  }

  /** Handles lifting the mouse button up on an object. */
  const handleItemUp = () => {
    if (draggingId) {
      dragHandlers.onEnd(draggingId)
      if (controlsRef.current) controlsRef.current.enabled = true
    }
    document.body.style.cursor = ''
  }

  return (
    <>
      <A11yAnnouncer />
      <div ref={statsParentRef} className='ce-room-stats-parent'>
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
          <Stats
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            parent={statsParentRef as any}
            className='ce-performance-stats'
          />
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

          <RoomBounds
            itemsDisplayed={items}
            itemPlaced={itemPlaced}
            onPlace={onPlace}
            dragHandlers={dragHandlers}
            onClearSelection={onClearSelection}
            draggingId={draggingId}
            handleItemUp={handleItemUp}
          ></RoomBounds>

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
            .filter((item) => item.item.models[0]?.url)
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
      </div>
    </>
  )
}
