import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutItem } from '../items'
import { EQUIPMENT } from '../items'

type ItemsInSceneProps = {
  items: LayoutItem[]
  selectedIds: Set<string>
  copiedItemsCount: number
  onSelectItem: (id: string, extend: boolean) => void
  onCopy: () => void
  onPaste: () => void
}

/**
 * Panel - SCENE: Displays the list of placed items in the scene, with their positions, rotations, and counts.
 */
export function ItemsInScene({
  items,
  selectedIds,
  copiedItemsCount,
  onSelectItem,
  onCopy,
  onPaste,
}: ItemsInSceneProps): ReactElement {
  const { t } = useTranslation()
  const selectedCount = items.filter((item) => selectedIds.has(item.id)).length

  return (
    <section className='ce-panel ce-items-panel'>
      <div className='ce-panel-heading'>
        <div>
          <p className='ce-eyebrow'>04 / {t('SCENE')}</p>
          <h2>{t('items')}</h2>
        </div>
        <span className='ce-count-pill'>{items.length}</span>
      </div>
      <div className='ce-table-scroll'>
        <table className='ce-table'>
          <thead>
            <tr>
              <th>{t('item')}</th>
              <th>{t('position')}</th>
              <th>{t('rotation')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={selectedIds.has(item.id) ? 'is-selected' : ''}
                onClick={(event) => onSelectItem(item.id, event.shiftKey)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ')
                    onSelectItem(item.id, event.shiftKey)
                }}
                tabIndex={0}
                aria-selected={selectedIds.has(item.id)}
              >
                <td>
                  <span
                    className='ce-table-color'
                    style={{ backgroundColor: EQUIPMENT[item.type].color }}
                  />
                  {t(EQUIPMENT[item.type].nameKey)}
                </td>
                <td>
                  {t('itemPosition', {
                    x: item.x.toFixed(1),
                    z: item.z.toFixed(1),
                  })}
                </td>
                <td>{item.rotation}°</td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className='ce-empty-row' colSpan={3}>
                  {t('placeToStart')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className='ce-list-actions'>
        <button type='button' onClick={onCopy} disabled={selectedCount === 0}>
          {t('copy')}
        </button>
        <button
          type='button'
          onClick={onPaste}
          disabled={copiedItemsCount === 0}
        >
          {t('paste')}
        </button>
      </div>
    </section>
  )
}
