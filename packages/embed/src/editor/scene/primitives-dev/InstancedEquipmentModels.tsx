import type { ThreeEvent } from '@react-three/fiber'
import type { EquipmentName, LayoutItem } from '../../items'
import { EQUIPMENT } from '../../items'
import { InstancedEquipmentType } from './InstancedEquipmentType'

/** Renders instanced models for the standard electrical equipment types. */
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
  const types = EQUIPMENT.filter(
    (equipment) => (equipment.models[0]?.url ?? '') === ''
  )
    .map((equipment) => equipment.name as EquipmentName)
    .filter(
      (type): type is 'drive' | 'cabinet' | 'panel' =>
        type === 'drive' || type === 'cabinet' || type === 'panel'
    )

  return (
    <>
      {types.map((type) => {
        const typeItems = items.filter((item) => item.item.name === type)
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
