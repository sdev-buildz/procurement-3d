import { describe, expect, it } from 'vitest'
import { getEquipment, type LayoutItem } from '../items'
import {
  calculateConnectionWireLength,
  createBillOfMaterials,
  wireUnitPriceUsd,
} from './BomPanel'

function layoutItem(
  id: string,
  x: number,
  z: number,
  connections?: string[]
): LayoutItem {
  return {
    id,
    item: getEquipment('drive'),
    x,
    z,
    rotation: 0,
    ...(connections && { connections }),
  }
}

describe('bill of materials wire costs', () => {
  it('counts each reciprocal connection once', () => {
    const items = [layoutItem('a', 0, 0, ['b']), layoutItem('b', 3, 4, ['a'])]

    expect(calculateConnectionWireLength(items)).toBe(5)
  })

  it('includes the connection wire as a priced BOM row', () => {
    const items = [layoutItem('a', 0, 0, ['b']), layoutItem('b', 3, 4, ['a'])]

    const rows = createBillOfMaterials(items)
    const wire = rows.find((row) => row.id === 'connection-wire')

    expect(wire).toEqual({
      id: 'connection-wire',
      name: 'connectionWire',
      sku: 'WIRE-1M',
      quantity: 5,
      unitPrice: wireUnitPriceUsd,
    })
  })

  it('ignores connections whose endpoints are missing', () => {
    expect(
      calculateConnectionWireLength([layoutItem('a', 0, 0, ['missing'])])
    ).toBe(0)
  })
})
