import { gql, type TypedDocumentNode } from '@apollo/client'
import { useSubscription } from '@apollo/client/react'
import { A11yAnnouncer } from '@react-three/a11y'
import { PerformanceMonitor } from '@react-three/drei'
import type { Dpr, ThreeEvent } from '@react-three/fiber'
import { Canvas, useThree } from '@react-three/fiber'
import { Perf } from 'r3f-perf'
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
} from 'react'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { RuleViolation } from '../hooks/useViolations'
import { EQUIPMENT, type LayoutItem } from '../items'
import { RoomContext } from './context'
import { EquipmentModel } from './model-wrappers/EquipmentModel'
import { InstancedMeshIndicators } from './model-wrappers/InstancedMeshIndicators'
import { NestedInstances } from './model-wrappers/NestedInstances'
import { InstancedEquipmentModels } from './primitives-dev/InstancedEquipmentModels'
import { RoomBounds } from './RoomBounds'
import { SceneItemLabels } from './SceneItemLabels'

type RoomSceneProps = {
  /** Current room equipment. */
  itemsDisplayed: LayoutItem[]
  /** IDs highlighted as selected in the editor panels. */
  selectedIds: Set<string>
  /** IDs participating in an active spacing violation. */
  violations: RuleViolation[]
  /** Suggested item transforms rendered as translucent ghosts. */
  previewItems: LayoutItem[]
  /** Whether to show the synchronized top-down camera. */
  topDown: boolean
  /** Selects an item, optionally extending the current selection. */
  onSelect: (id: string, extend: boolean) => void
  dpr: Dpr
  showLabels: boolean
} & Omit<ComponentProps<typeof RoomBounds>, 'handleItemUp'>

type CuringTelemetry = {
  machineId: string
  timestamp: string
  cycleTimeMs: number
  cycleTimeVariationPercent: number
  alert: string
  rootCause: string
  oeePercent: number
  machineHealthPercent: number
  temperatureC: number
  pressureBar: number
  packetLossPercent: number
  connectionState: 'connected' | 'degraded' | 'reconnecting'
}

const DEFAULT_CURING_TELEMETRY: CuringTelemetry = {
  machineId: 'CURING-01',
  timestamp: new Date().toISOString(),
  cycleTimeMs: 420000,
  cycleTimeVariationPercent: 1.8,
  alert: 'Normal',
  rootCause: 'No active fault',
  oeePercent: 91.2,
  machineHealthPercent: 96.4,
  temperatureC: 171,
  pressureBar: 18.2,
  packetLossPercent: 0.4,
  connectionState: 'connected',
}

const CURING_TELEMETRY_SUBSCRIPTION = gql`
  subscription CuringTelemetry {
    curingTelemetry {
      machineId
      timestamp
      cycleTimeMs
      cycleTimeVariationPercent
      alert
      rootCause
      oeePercent
      machineHealthPercent
      temperatureC
      pressureBar
      packetLossPercent
      connectionState
    }
  }
` as TypedDocumentNode<{ curingTelemetry: CuringTelemetry }>

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
  previewItems,
  topDown,
  onSelect,
  onClearSelection,
  showLabels,
  itemPlaced,
  onPlace,
  dragHandlers,
  draggingId,
  dpr,
}: RoomSceneProps) {
  const controlsRef = useRef<OrbitControls | null>(null)
  const statsParentRef = useRef<HTMLDivElement>(null)
  const violationIds = useMemo(
    () =>
      new Set(violations.flatMap(({ first, second }) => [first.id, second.id])),
    [violations]
  )
  const { lodBound, setLodBound } = useContext(RoomContext)
  const curingItems = items.filter((item) => item.item.name === 'tyreCuring')
  const { data: curingData } = useSubscription(CURING_TELEMETRY_SUBSCRIPTION, {
    skip: curingItems.length === 0,
    fetchPolicy: 'network-only',
  })
  const telemetry = curingData?.curingTelemetry ?? DEFAULT_CURING_TELEMETRY

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
          key={topDown ? 'orthographic-camera' : 'perspective-camera'}
          shadows
          gl={{ localClippingEnabled: true }}
          dpr={dpr}
          orthographic={topDown}
          camera={{
            position: topDown ? [0, 10, 0.01] : [14, 12, 16],
            near: 0.1,
            far: 100,
            ...(topDown
              ? {
                  left: -12,
                  right: 12,
                  top: 10,
                  bottom: -10,
                }
              : { fov: 42 }),
          }}
          onPointerMissed={onClearSelection}
        >
          <PerformanceMonitor
            bounds={(refreshrate) => [refreshrate / 2, refreshrate]}
            onDecline={() => setLodBound(lodBound + 1)}
            onIncline={() => setLodBound(Math.max(0, lodBound - 1))}
          />
          <Perf />
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

          {showLabels ? (
            <SceneItemLabels
              items={items}
              selectedIds={selectedIds}
              violationIds={violationIds}
              topDown={topDown}
            />
          ) : null}

          <InstancedEquipmentModels
            items={items}
            selectedIds={selectedIds}
            violationIds={violationIds}
            onPointerDown={(item, event) => handleItemDown(item, event)}
            onPointerMove={(item, event) => handleItemMove(item, event)}
            onPointerUp={handleItemUp}
            onPointerCancel={handleItemUp}
          />
          {curingItems.map((item) => (
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
          {EQUIPMENT.filter((itemType) => itemType.models[0]?.url).map(
            (itemType) => {
              const instancesInScene = items.filter(
                (item) => item.item.id === itemType.id
              )
              if (!instancesInScene.length) return <></>
              return (
                <NestedInstances
                  itemType={itemType}
                  itemsToInstance={instancesInScene}
                  key={itemType.id}
                  isRoot={true}
                  // isRoot={true}
                  onPointerDown={(item, event) => handleItemDown(item, event)}
                  onPointerMove={(item, event) => handleItemMove(item, event)}
                  onPointerUp={handleItemUp}
                  onPointerCancel={handleItemUp}
                />
              )
            }
          )}
          <InstancedMeshIndicators
            items={items.filter((item) => item.item.models[0]?.url)}
            selectedIds={selectedIds}
            violationIds={violationIds}
          />
          {/* <InstancedPotAndCoals count={500} /> */}
          {previewItems.map((previewItem) => (
            <EquipmentModel
              key={previewItem.id}
              item={previewItem}
              selected={false}
              violation={false}
              ghost
            />
          ))}
        </Canvas>
        {curingItems.length ? (
          <section
            className='ce-curing-metrics'
            aria-label='Tyre curing plant metrics'
          >
            <header>
              <div>
                <span
                  className={`ce-metric-status ${telemetry.connectionState}`}
                />
                <strong>{telemetry.machineId}</strong>
              </div>
              <small>{telemetry.connectionState}</small>
            </header>
            <div className='ce-curing-metric-grid'>
              <article>
                <small>Cycle-time variation</small>
                <strong>
                  {telemetry.cycleTimeVariationPercent.toFixed(1)}%
                </strong>
                <span>{Math.round(telemetry.cycleTimeMs / 1000)}s / cycle</span>
              </article>
              <article
                className={telemetry.alert === 'Normal' ? '' : 'is-alert'}
              >
                <small>Alert & root cause</small>
                <strong>{telemetry.alert}</strong>
                <span>{telemetry.rootCause}</span>
              </article>
              <article>
                <small>OEE</small>
                <strong>{telemetry.oeePercent.toFixed(1)}%</strong>
                <span>
                  {telemetry.packetLossPercent.toFixed(1)}% packet loss
                </span>
              </article>
              <article>
                <small>Machine health</small>
                <strong>{telemetry.machineHealthPercent.toFixed(1)}%</strong>
                <span>
                  {telemetry.temperatureC.toFixed(1)} C /{' '}
                  {telemetry.pressureBar.toFixed(1)} bar
                </span>
              </article>
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}
