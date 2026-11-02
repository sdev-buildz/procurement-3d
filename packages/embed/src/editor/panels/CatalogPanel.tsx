import type { CSSProperties, ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { ItemType } from '../items'
import { EQUIPMENT } from '../items'

/** Lists equipment that can be placed in the room. */
export function CatalogPanel({
  itemPlaced,
  onSelectItem,
}: {
  itemPlaced: ItemType | null
  onSelectItem: (type: ItemType) => void
}): ReactElement {
  const { t } = useTranslation()

  return (
    <aside className='ce-palette ce-panel'>
      {/* header */}
      <div className='ce-panel-heading'>
        <div>
          <p className='ce-eyebrow'>01 / {t('PLACE')}</p>
          <h2>{t('addEquipment')}</h2>
        </div>
        <span className='ce-step-icon' aria-hidden='true'>
          ＋
        </span>
      </div>

      <div className='ce-palette-list'>
        {EQUIPMENT.map((equipment) => {
          return (
            // An item in the catalog
            <button
              type='button'
              className={`ce-palette-item ${itemPlaced?.id === equipment.id ? 'is-selected' : ''}`}
              key={equipment.name}
              onClick={() => onSelectItem(equipment)}
              aria-pressed={itemPlaced?.id === equipment.id}
            >
              <span
                className={`ce-equipment-icon ce-icon-${equipment.name}`}
                style={
                  { '--equipment-color': equipment.color } as CSSProperties
                }
                aria-hidden='true'
              >
                <span />
              </span>
              <span className='ce-palette-copy'>
                <strong>{t(equipment.nameKey)}</strong>
                <small>
                  {equipment.width} × {equipment.depth} × {equipment.height} m
                </small>
              </span>
              <span className='ce-add-mark' aria-hidden='true'>
                ＋
              </span>
            </button>
          )
        })}
      </div>

      <div className={`ce-placement-tip ${itemPlaced?.name ? 'is-ready' : ''}`}>
        <span aria-hidden='true'>⌖</span>
        {itemPlaced ? t('clickToPlace') : t('selectToEdit')}
      </div>

      <div className='ce-grid-note'>
        <span className='ce-grid-sample' aria-hidden='true' />
        <div>
          <strong>0.5 m</strong>
          <small>{t('fixedGrid')}</small>
        </div>
      </div>
    </aside>
  )
}
