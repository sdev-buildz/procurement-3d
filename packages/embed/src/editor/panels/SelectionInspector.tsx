import type { CSSProperties, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { useHistory } from '../hooks/useHistory'
import type { LayoutItem } from '../items'
import { EQUIPMENT, ROOM } from '../items'

type SelectionInspectorProps = {
  items: LayoutItem[]
  selectedItems: LayoutItem[]
  selectedItem: LayoutItem | null
  onPositionChange: (axis: 'x' | 'z', value: number) => void
  onRotate: () => void
  onDelete: () => void
  onAlign: () => void
  onDistribute: () => void
} & Pick<ReturnType<typeof useHistory>, 'commitItems'>

/**
 * Displays editable properties and arrangement actions for the selection.
 * The side panel that shows properties for the currently selected equipment(s).
 */
export function SelectionInspector({
  items,
  selectedItems,
  selectedItem,
  onPositionChange,
  onRotate,
  onDelete,
  onAlign,
  onDistribute,
  commitItems,
}: SelectionInspectorProps): ReactElement {
  const { t } = useTranslation()
  const selectionWired =
    selectedItems.length > 1 &&
    selectedItems
      .slice(1)
      .every((item) => selectedItems[0]?.connections?.includes(item.id))
  const toggleWires = () => {
    if (selectedItems.length < 2) return
    const anchor = selectedItems[0]
    if (!anchor) return
    const otherIds = selectedItems.slice(1).map(({ id }) => id)
    const disconnect = otherIds.every((id) => anchor.connections?.includes(id))
    const selected = new Set([anchor.id, ...otherIds])

    commitItems(
      items.map((item) => {
        if (!selected.has(item.id)) return item
        const connections = new Set(item.connections ?? [])
        for (const otherId of otherIds) {
          if (item.id === anchor.id) {
            if (disconnect) connections.delete(otherId)
            else connections.add(otherId)
          } else if (item.id === otherId) {
            if (disconnect) connections.delete(anchor.id)
            else connections.add(anchor.id)
          }
        }
        return { ...item, connections: [...connections] }
      })
    )
  }
  return (
    <section className='ce-panel ce-properties'>
      <div className='ce-panel-heading'>
        <div>
          <p className='ce-eyebrow'>02 / {t('INSPECT')}</p>
          <h2>{t('properties')}</h2>
        </div>
        {selectedItems.length > 1 ? (
          <span className='ce-selection-count'>
            {t('selectedCount', { count: selectedItems.length })}
          </span>
        ) : null}
      </div>
      {selectedItem ? (
        // Single item selected.
        <div className='ce-property-content'>
          <div className='ce-selected-name'>
            <span
              className={`ce-equipment-icon ce-icon-${selectedItem.type}`}
              style={
                {
                  '--equipment-color': EQUIPMENT[selectedItem.type].color,
                } as CSSProperties
              }
              aria-hidden='true'
            >
              <span />
            </span>
            <div>
              <strong>{t(EQUIPMENT[selectedItem.type].nameKey)}</strong>
              <small>
                {EQUIPMENT[selectedItem.type].sku} · {selectedItem.id}
              </small>
            </div>
          </div>
          <label className='ce-field-label'>{t('position')}</label>

          {/* Edit Position */}
          <div className='ce-position-fields'>
            {/* Along x-axis */}
            <label>
              <span>X</span>
              <input
                type='number'
                step={ROOM.cellSize}
                value={selectedItem.x}
                onChange={(event) =>
                  onPositionChange('x', Number(event.target.value))
                }
                aria-label={t('xPosition')}
              />
            </label>
            <label>
              {/* Along z-axis */}
              <span>Z</span>
              <input
                type='number'
                step={ROOM.cellSize}
                value={selectedItem.z}
                onChange={(event) =>
                  onPositionChange('z', Number(event.target.value))
                }
                aria-label={t('zPosition')}
              />
            </label>
            <span className='ce-unit'>m</span>
          </div>

          {/* Edit Rotation */}
          <div className='ce-rotation-row'>
            <span>{t('rotation')}</span>
            <strong>{selectedItem.rotation}°</strong>
            <button type='button' onClick={onRotate}>
              {t('rotate')}
            </button>
          </div>

          {/* Delete and remove the selected item from the scene. */}
          <button type='button' className='ce-danger-button' onClick={onDelete}>
            <span aria-hidden='true'>×</span>
            {t('delete')}
          </button>
        </div>
      ) : selectedItems.length > 1 ? (
        // Multiple items selected.
        <div className='ce-multi-tools'>
          <p>{t('arrangeSelection')}</p>
          <button type='button' onClick={onAlign}>
            {t('alignLeft')}
          </button>
          <button
            type='button'
            onClick={onDistribute}
            disabled={selectedItems.length < 3}
          >
            {t('distribute')}
          </button>
          <button type='button' onClick={onRotate}>
            {t('rotate')}
          </button>

          {/* Connect the selections with wires. If already wired, unwire. */}
          <button type='button' onClick={toggleWires}>
            {t(selectionWired ? 'disconnect' : 'connect')}
          </button>

          {/* Delete all the selected items. */}
          <button type='button' className='ce-danger-button' onClick={onDelete}>
            {t('delete')}
          </button>
        </div>
      ) : (
        // No items selected.
        <div className='ce-empty-inspector'>
          <span aria-hidden='true'>⌖</span>
          <p>{t('nothingSelected')}</p>
          <small>{t('emptyInspectorHelp')}</small>
        </div>
      )}
    </section>
  )
}
