import { useMemo, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatCurrencyFromUSD,
  type TargetCurrency,
} from '../../utils/currency'
import type { LayoutItem } from '../items'

/** Aggregated quantity and unit price for one BOM row. */
type BillOfMaterialsRow = {
  /** Stable row key. */
  id: string
  /** Display name or translation key for the row. */
  name: string
  /** Procurement identifier for the row. */
  sku: string
  /** Number of matching pieces or meters in the current layout. */
  quantity: number
  /** Price for one piece or meter in USD. */
  unitPrice: number
}

/** Estimated cost of connection wire, in USD per meter. */
export const wireUnitPriceUsd = 25

/**
 * Calculates the total length of unique connection wires in a layout.
 * Reciprocal connections are counted once, and missing endpoints are ignored.
 */
export function calculateConnectionWireLength(items: LayoutItem[]): number {
  const byId = new Map(items.map((item) => [item.id, item]))
  let length = 0

  for (const item of items) {
    for (const connectionId of item.connections ?? []) {
      if (item.id >= connectionId) continue
      const connectedItem = byId.get(connectionId)
      if (!connectedItem) continue
      length += Math.hypot(connectedItem.x - item.x, connectedItem.z - item.z)
    }
  }

  return length
}

/**
 * Calculates the bill of materials.
 * @param items - Current room layout.
 * @returns One row per category present in the room.
 */
export function createBillOfMaterials(
  items: LayoutItem[]
): BillOfMaterialsRow[] {
  const rows: BillOfMaterialsRow[] = []

  for (const item of items) {
    const row = rows.find((row) => row.id === String(item.item.id))
    if (row) {
      row.quantity += 1
    } else {
      rows.push({
        id: String(item.item.id),
        name: item.item.name,
        sku: item.item.sku,
        quantity: 1,
        unitPrice: item.item.price,
      })
    }
  }

  const wireLength = calculateConnectionWireLength(items)
  if (wireLength > 0) {
    rows.push({
      id: 'connection-wire',
      name: 'connectionWire',
      sku: 'WIRE-1M',
      quantity: wireLength,
      unitPrice: wireUnitPriceUsd,
    })
  }

  return rows
}

/**
 * Displays the BOM ( Bill Of Materials ) for the current equipments in the scene.
 */
export function BomPanel({ items }: { items: LayoutItem[] }): ReactElement {
  const { t } = useTranslation()
  const billOfMaterials = useMemo(() => createBillOfMaterials(items), [items])
  const total = billOfMaterials.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice,
    0
  )
  const formatPrice = (price: number) =>
    formatCurrencyFromUSD({
      amountInUSD: price,
      targetCurrency: t('currency') as TargetCurrency,
    })

  return (
    <section className='ce-panel ce-bom-panel'>
      <div className='ce-panel-heading'>
        <div>
          <p className='ce-eyebrow'>05 / {t('PROCUREMENT')}</p>
          <h2>{t('billOfMaterials')}</h2>
        </div>
        <span className='ce-count-pill'>
          {items.length} {t('items').toLowerCase()}
        </span>
      </div>
      <div className='ce-table-scroll'>
        <table className='ce-table ce-bom-table'>
          <thead>
            <tr>
              <th>{t('item')}</th>
              <th>{t('sku')}</th>
              <th>{t('quantity')}</th>
              <th>{t('unitPrice')}</th>
            </tr>
          </thead>
          <tbody>
            {billOfMaterials.map((row) => (
              <tr key={row.id}>
                <td>
                  <span
                    className='ce-table-color'
                    style={{
                      backgroundColor: '#000000',
                    }}
                  />
                  {t(row.name)}
                </td>
                <td>{row.sku}</td>
                <td>
                  {row.id === 'connection-wire'
                    ? `${row.quantity.toFixed(2)} m`
                    : row.quantity}
                </td>
                <td>{formatPrice(row.unitPrice)}</td>
              </tr>
            ))}
            {billOfMaterials.length === 0 ? (
              <tr>
                <td className='ce-empty-row' colSpan={4}>
                  {t('emptyBom')}
                </td>
              </tr>
            ) : null}
          </tbody>
          {billOfMaterials.length ? (
            <tfoot>
              <tr>
                <td colSpan={3}>{t('total')}</td>
                <td>{formatPrice(total)}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  )
}
