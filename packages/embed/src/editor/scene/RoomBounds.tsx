import { useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { DragHandlers } from '../hooks/useDrag'
import { ROOM, type EquipmentName, type LayoutItem } from '../items'

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

/**
 * The walls and floor of the room.
 * It is used to visualize the limits of the room and ensure that equipment and other objects are placed within the defined area.
 * The floor has grid.
 */
export const RoomBounds = ({
  itemsDisplayed,
  placementType,
  onPlace,
  onClearSelection,
  dragHandlers,
  draggingId,
  handleItemUp,
}: {
  itemsDisplayed: LayoutItem[]
  /** Equipment category to place when the floor is clicked. */
  placementType: EquipmentName | null
  /** Adds the active palette item at the clicked floor position. */
  onPlace: (x: number, z: number) => void
  /** Clears the active selection. */
  onClearSelection: () => void

  dragHandlers: DragHandlers
  draggingId: string | undefined

  handleItemUp: () => void
}) => {
  const gridGeometry = useMemo(makeGridGeometry, [])
  const wireGeometry = useMemo(
    () => makeWireGeometry(itemsDisplayed),
    [itemsDisplayed]
  )

  return (
    <>
      {/* The floor */}
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
          if (draggingId) {
            dragHandlers.onMove(draggingId, event.point.x, event.point.z)
          }
        }}
        onPointerUp={handleItemUp}
        onPointerCancel={handleItemUp}
      >
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color='#202b34' roughness={0.9} />
      </mesh>

      {/* Grid on the floor */}
      <lineSegments geometry={gridGeometry}>
        <lineBasicMaterial color='#3a4954' transparent opacity={0.66} />
      </lineSegments>
      <lineSegments geometry={wireGeometry}>
        <lineBasicMaterial color='#75e6d1' transparent opacity={0.9} />
      </lineSegments>

      {/* Room walls */}
      <mesh position={[0, 1.5, -ROOM.depth / 2]} receiveShadow>
        <boxGeometry args={[ROOM.width, 3, 0.12]} />
        <meshStandardMaterial color='#28343d' roughness={0.84} />
      </mesh>
      <mesh position={[-ROOM.width / 2, 1.5, 0]} receiveShadow>
        <boxGeometry args={[0.12, 3, ROOM.depth]} />
        <meshStandardMaterial color='#25313a' roughness={0.84} />
      </mesh>
    </>
  )
}
