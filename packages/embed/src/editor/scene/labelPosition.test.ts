import { describe, expect, it } from 'vitest'
import { getEquipment, type LayoutItem } from '../items'
import { getSceneItemLabelPosition } from './labelPosition'

const item: LayoutItem = {
  id: 'item-1',
  item: getEquipment('drive'),
  label: 'Drive 1',
  x: 2,
  z: -3,
  rotation: 0,
}

describe('getSceneItemLabelPosition', () => {
  it('places top-down labels beside the rotated equipment footprint', () => {
    const unrotatedPosition = getSceneItemLabelPosition(item, true)
    const rotatedPosition = getSceneItemLabelPosition(
      { ...item, rotation: 90 },
      true
    )

    expect(unrotatedPosition[0]).toBeCloseTo(
      item.x + item.item.width / 2 + 0.25
    )
    expect(rotatedPosition[0]).toBeCloseTo(item.x + item.item.depth / 2 + 0.25)
    expect(unrotatedPosition.slice(1)).toEqual([item.item.height + 0.2, item.z])
  })

  it('keeps perspective-view labels centered over equipment', () => {
    expect(getSceneItemLabelPosition(item, false)).toEqual([
      item.x,
      item.item.height + 0.2,
      item.z,
    ])
  })
})
