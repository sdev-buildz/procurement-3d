import type { Dpr } from '@react-three/fiber'
import { useCallback, useContext, useState, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { makeId } from '../../utils/makeId'
import type { useHistory } from '../hooks/useHistory'
import {
  getDefaultItemLabel,
  getEquipment,
  ROOM,
  type ItemType,
  type LayoutItem,
} from '../items'
import { RoomContext } from '../scene/context'

type PerformancePanelProps = {
  items: LayoutItem[]
  dpr: Dpr
  setDpr: (dpr: Dpr) => void
  open: boolean
  setIsOpen: (open: boolean) => void
  itemPlaced: ItemType | null
  showLabels: boolean
  setShowLabels: (show: boolean) => void
} & Pick<ReturnType<typeof useHistory>, 'commitItems'>

/**
 * Displays editable properties and arrangement actions for the selection.
 * The side panel that shows properties for the currently selected equipment(s).
 */
export function PerformancePanel({
  items,
  commitItems,
  dpr,
  setDpr,
  open,
  setIsOpen,
  itemPlaced,
  showLabels,
  setShowLabels,
}: PerformancePanelProps): ReactElement {
  const { t } = useTranslation()
  const [perfMonitorEnabled, setPerfMonitorEnabled] = useState(true)
  const [minDpr, setMinDpr] = useState(1)
  const [maxDpr, setMaxDpr] = useState(1.5)
  const { lodBound } = useContext(RoomContext)

  const updateDpr = useCallback(
    (nextMin: number, nextMax: number) => {
      if (nextMax < nextMin) return
      setMinDpr(nextMin)
      setMaxDpr(nextMax)
      setDpr([nextMin, nextMax])
    },
    [setDpr]
  )

  /**
   * Adds 500 instanced 3D modals to the scene.
   *  Used to test perf.
   */
  const add500Instanced = useCallback(() => {
    const minx = -ROOM.width / 2
    const maxx = ROOM.width / 2
    const minz = -ROOM.depth / 2
    let x = minx,
      z = minz

    const itemType = itemPlaced ?? getEquipment('potOfCoals')

    const itemsCopy: LayoutItem[] = [...items]

    for (let j = 0; j < 500; j += 1) {
      if (x < maxx) x += 1 / 2
      else {
        x = minx
        z = z + 1 / 2
      }
      itemsCopy.push({
        id: makeId(itemType),
        item: itemType,
        label: getDefaultItemLabel(itemType, itemsCopy),
        x,
        z,
        rotation: 0,
      })
    }

    commitItems(itemsCopy)
  }, [commitItems, items, itemPlaced])

  return (
    <section className='ce-panel ce-performance'>
      <details
        open={open}
        onToggle={(event) => {
          setIsOpen(event.currentTarget.open)
        }}
      >
        <summary className='ce-panel-heading'>
          <hgroup>
            <p className='ce-eyebrow'>06 / {t('INSPECT')}</p>
            <h2>{t('PERFORMANCE')}</h2>
          </hgroup>
        </summary>
        <div className='ce-performance-content'>
          <p className='ce-performance-description'>
            These settings help adjust rendering quality and scene performance.
          </p>
          <fieldset className='ce-performance-options'>
            <legend>{t('labels')}</legend>
            <label className='ce-check-option' htmlFor='toggle-item-labels'>
              <input
                id='toggle-item-labels'
                type='checkbox'
                checked={showLabels}
                onChange={(event) => setShowLabels(event.currentTarget.checked)}
              />
              <span>
                <strong>{t('showLabels')}</strong>
              </span>
            </label>
          </fieldset>
          <fieldset className='ce-performance-options'>
            <legend>Rendering</legend>

            {/* Toggle Drei Performance Monitor, which auto-adjusts based on FPS. */}
            <label className='ce-check-option' htmlFor='toggle-perf-monitor'>
              <input
                id='toggle-perf-monitor'
                type='checkbox'
                checked={perfMonitorEnabled}
                onChange={(event) =>
                  setPerfMonitorEnabled(event.currentTarget.checked)
                }
              />
              <span>
                <strong>Performance monitor</strong>
                <small>
                  Automatically optimize model compressions to maintain frame
                  rate to be higer than half of the screen's maximum frame rate.
                  Currently compressing models upto {lodBound} levels.
                </small>
              </span>
            </label>
          </fieldset>
          {/* DPR Range - Dots to Pixel Ratio */}
          <fieldset className='ce-performance-options'>
            <legend>{t('dpr')} range</legend>
            <div className='ce-dpr-fields'>
              <label htmlFor='dpr-input-min'>
                <span>Minimum</span>
                <input
                  id='dpr-input-min'
                  type='number'
                  min='0.1'
                  max='4'
                  step='0.1'
                  value={typeof dpr === 'number' ? dpr : dpr[0]}
                  onChange={(event) => {
                    updateDpr(Number(event.currentTarget.value), maxDpr)
                  }}
                />
              </label>
              <label htmlFor='dpr-input-max'>
                <span>Maximum</span>
                <input
                  id='dpr-input-max'
                  type='number'
                  min='0.1'
                  max='4'
                  step='0.1'
                  value={typeof dpr === 'number' ? dpr : dpr[1]}
                  onChange={(event) =>
                    updateDpr(minDpr, Number(event.currentTarget.value))
                  }
                />
              </label>
            </div>
          </fieldset>
          <button
            type='button'
            className='ce-tool-button ce-performance-add'
            onClick={add500Instanced}
          >
            <span aria-hidden='true'>+</span>
            {t('add500')}
          </button>
        </div>
      </details>
    </section>
  )
}
