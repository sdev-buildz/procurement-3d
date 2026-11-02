import { useMemo, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import {
  formatCurrencyFromUSD,
  type TargetCurrency,
} from '../../utils/currency'
import type { EquipmentName, LayoutItem } from '../items'
import { EQUIPMENT } from '../items'

/** Aggregated quantity and unit price for one BOM row. */
type BillOfMaterialsRow = {
  /** Catalog key for the row. */
  equipmentName: EquipmentName
  /** Number of matching pieces in the current layout. */
  quantity: number
  /** Price for one piece in USD. */
  unitPrice: number
}

/**
 * Calculates the bill of materials.
 * @param items - Current room layout.
 * @returns One row per category present in the room.
 */
function createBillOfMaterials(items: LayoutItem[]): BillOfMaterialsRow[] {
  const rows = new Map<EquipmentName, BillOfMaterialsRow>()

  for (const item of items) {
    const row = rows.get(item.type)
    if (row) {
      row.quantity += 1
    } else {
      rows.set(item.type, {
        equipmentName: item.type,
        quantity: 1,
        unitPrice: EQUIPMENT[item.type].price,
      })
    }
  }

  return [...rows.values()]
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
          {billOfMaterials.reduce((sum, row) => sum + row.quantity, 0)}{' '}
          {t('items').toLowerCase()}
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
              <tr key={row.equipmentName}>
                <td>
                  <span
                    className='ce-table-color'
                    style={{
                      backgroundColor: EQUIPMENT[row.equipmentName].color,
                    }}
                  />
                  {t(EQUIPMENT[row.equipmentName].nameKey)}
                </td>
                <td>{EQUIPMENT[row.equipmentName].sku}</td>
                <td>{row.quantity}</td>
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
