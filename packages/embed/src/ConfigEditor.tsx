/* eslint jsdoc/require-jsdoc: off */
import type { CSSProperties, ReactElement } from 'react'
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import './ConfigEditor.css'
import { AssistantPanel } from './editor/assistant/AssistantPanel'
import type { AssistantReply } from './editor/assistant/assistantReply'
import { formatCurrencyFromUSD, type TargetCurrency } from './editor/currency'
import { createLayoutHistory, layoutHistoryReducer } from './editor/history'
import { i18n } from './editor/i18n'
import {
  constrainPosition,
  createBillOfMaterials,
  findRuleViolations,
  initialLayout,
} from './editor/layout'
import { RoomScene } from './editor/scene/RoomScene'
import type { LayoutItem } from './editor/types'
import { EQUIPMENT, ROOM } from './editor/types'

type AssistantProposal = {
  ghost: LayoutItem
}

function makeId(type: LayoutItem['type']): string {
  return `${type}-${crypto.randomUUID()}`
}

/** Provides the interactive electrical-room editor and its supporting panels. */
export function ConfigEditor(): ReactElement {
  const { t } = useTranslation()
  const [history, dispatch] = useReducer(
    layoutHistoryReducer,
    initialLayout,
    createLayoutHistory
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [placementType, setPlacementType] = useState<LayoutItem['type'] | null>(
    null
  )
  const [dragPreview, setDragPreview] = useState<LayoutItem | null>(null)
  const dragRef = useRef<LayoutItem | null>(null)
  const [topDown, setTopDown] = useState(false)
  const [copiedItems, setCopiedItems] = useState<LayoutItem[]>([])
  const [proposal, setProposal] = useState<AssistantProposal | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const items = history.present
  const itemsRef = useRef(items)
  const displayItems = dragPreview
    ? items.map((item) => (item.id === dragPreview.id ? dragPreview : item))
    : items
  const violations = useMemo(
    () => findRuleViolations(displayItems),
    [displayItems]
  )
  const violationIds = useMemo(
    () =>
      new Set(violations.flatMap(({ first, second }) => [first.id, second.id])),
    [violations]
  )
  const billOfMaterials = useMemo(() => createBillOfMaterials(items), [items])
  const selectedItems = items.filter((item) => selectedIds.has(item.id))
  const selectedItem = selectedItems.length === 1 ? selectedItems[0] : null
  const selectionWired =
    selectedItems.length > 1 &&
    selectedItems
      .slice(1)
      .every((item) => selectedItems[0]?.connections?.includes(item.id))
  const total = billOfMaterials.reduce(
    (sum, row) => sum + row.quantity * row.unitPrice,
    0
  )

  const commitItems = (nextItems: LayoutItem[]) => {
    dispatch({ type: 'commit', items: nextItems })
  }
  const selectItem = (id: string, extend: boolean) => {
    setSelectedIds((current) => {
      if (!extend) return new Set([id])
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setPlacementType(null)
  }
  const clearSelection = () => setSelectedIds(new Set())

  const updateSelected = (update: (item: LayoutItem) => LayoutItem) => {
    if (selectedIds.size === 0) return
    commitItems(
      items.map((item) => (selectedIds.has(item.id) ? update(item) : item))
    )
  }

  const moveSelection = (dx: number, dz: number) => {
    updateSelected((item) => ({
      ...item,
      ...constrainPosition(item, item.x + dx, item.z + dz),
    }))
  }

  const removeSelection = () => {
    if (selectedIds.size === 0) return
    commitItems(
      items
        .filter((item) => !selectedIds.has(item.id))
        .map((item) => {
          if (!item.connections) return item
          return {
            ...item,
            connections: item.connections.filter((id) => !selectedIds.has(id)),
          }
        })
    )
    setSelectedIds(new Set())
    setAnnouncement(t('delete'))
  }

  const rotateSelection = () => {
    updateSelected((item) => ({
      ...item,
      rotation: (item.rotation + 90) % 360,
    }))
  }

  const copySelection = () => {
    setCopiedItems(selectedItems.map((item) => ({ ...item })))
  }

  const pasteSelection = () => {
    if (copiedItems.length === 0) return
    const newIds = new Map(
      copiedItems.map((item) => [item.id, makeId(item.type)])
    )
    const pasted = copiedItems.map((item) => {
      const id = newIds.get(item.id)
      if (!id) return item
      return {
        ...item,
        id,
        connections: (item.connections ?? [])
          .filter((connectedId) => newIds.has(connectedId))
          .map((connectedId) => newIds.get(connectedId))
          .filter(
            (connectedId): connectedId is string => connectedId !== undefined
          ),
        ...constrainPosition(
          item,
          item.x + ROOM.cellSize,
          item.z + ROOM.cellSize
        ),
      }
    })
    commitItems([...items, ...pasted])
    setSelectedIds(new Set(pasted.map(({ id }) => id)))
    setAnnouncement(t('paste'))
  }

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

  const alignSelection = () => {
    if (selectedItems.length < 2) return
    const leftmost = Math.min(...selectedItems.map(({ x }) => x))
    commitItems(
      items.map((item) =>
        selectedIds.has(item.id)
          ? { ...item, ...constrainPosition(item, leftmost, item.z) }
          : item
      )
    )
  }

  const distributeSelection = () => {
    if (selectedItems.length < 3) return
    const ordered = [...selectedItems].sort((a, b) => a.x - b.x)
    const first = ordered[0]
    const last = ordered.at(-1)
    if (!first || !last) return
    const spacing = (last.x - first.x) / (ordered.length - 1)
    const positions = new Map(
      ordered.map((item, index) => [
        item.id,
        constrainPosition(item, first.x + spacing * index, item.z).x,
      ])
    )
    commitItems(
      items.map((item) => {
        const x = positions.get(item.id)
        return x === undefined ? item : { ...item, x }
      })
    )
  }

  const beginDrag = (id: string) => {
    const item = items.find((candidate) => candidate.id === id)
    if (item) dragRef.current = item
  }

  const updateDrag = (id: string, x: number, z: number) => {
    const item = dragRef.current
    if (!item || item.id !== id) return
    const next = { ...item, ...constrainPosition(item, x, z) }
    dragRef.current = next
    setDragPreview(next)
  }

  const finishDrag = (id: string) => {
    const moved = dragRef.current
    dragRef.current = null
    setDragPreview(null)
    if (!moved || moved.id !== id) return
    const original = items.find((item) => item.id === id)
    if (original && (original.x !== moved.x || original.z !== moved.z)) {
      commitItems(items.map((item) => (item.id === id ? moved : item)))
      setAnnouncement(`${t('position')} ${moved.x}, ${moved.z}`)
    }
  }

  const addItem = (type: LayoutItem['type'], x: number, z: number) => {
    const item: LayoutItem = {
      id: makeId(type),
      type,
      ...constrainPosition({ id: '', type, x: 0, z: 0, rotation: 0 }, x, z),
      rotation: 0,
    }
    commitItems([...items, item])
    setSelectedIds(new Set([item.id]))
    setPlacementType(null)
    setAnnouncement(
      t('placedAnnouncement', { item: t(EQUIPMENT[type].nameKey) })
    )
  }

  const changePosition = (axis: 'x' | 'z', value: number) => {
    if (!selectedItem || !Number.isFinite(value)) return
    const position = constrainPosition(
      selectedItem,
      axis === 'x' ? value : selectedItem.x,
      axis === 'z' ? value : selectedItem.z
    )
    commitItems(
      items.map((item) =>
        item.id === selectedItem.id ? { ...item, ...position } : item
      )
    )
  }

  const undo = useCallback(() => {
    dispatch({ type: 'undo' })
  }, [])
  const redo = useCallback(() => {
    dispatch({ type: 'redo' })
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }

      const modifier = event.ctrlKey || event.metaKey
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      } else if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
      } else if (modifier && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        copySelection()
      } else if (modifier && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        pasteSelection()
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        removeSelection()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        moveSelection(-ROOM.cellSize, 0)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveSelection(ROOM.cellSize, 0)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveSelection(0, -ROOM.cellSize)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveSelection(0, ROOM.cellSize)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    copySelection,
    moveSelection,
    pasteSelection,
    redo,
    removeSelection,
    undo,
  ])

  const handleAssistantReply = (reply: AssistantReply) => {
    const change = reply.proposedChange
    if (!change) {
      setProposal(null)
      return
    }

    const currentItems = itemsRef.current
    const currentItem = currentItems.find((item) => item.id === change.itemId)
    if (!currentItem) {
      setProposal(null)
      return
    }

    setProposal({
      ghost: {
        ...currentItem,
        ...constrainPosition(currentItem, change.target.x, change.target.z),
      },
    })
  }

  const acceptProposal = () => {
    if (!proposal) return
    const currentItems = itemsRef.current
    if (!currentItems.some((item) => item.id === proposal.ghost.id)) {
      setProposal(null)
      return
    }
    commitItems(
      currentItems.map((item) =>
        item.id === proposal.ghost.id ? proposal.ghost : item
      )
    )
    setSelectedIds(new Set([proposal.ghost.id]))
    setProposal(null)
    setAnnouncement(t('accept'))
  }

  const formatPrice = (price: number) =>
    formatCurrencyFromUSD({
      amountInUSD: price,
      targetCurrency: t('currency') as TargetCurrency,
    })

  return (
    <main className='ce-shell'>
      <header className='ce-topbar'>
        <div className='ce-brand'>
          <div className='ce-brand-mark' aria-hidden='true'>
            ⌂
          </div>
          <div>
            <p className='ce-eyebrow'>{t('project')}</p>
            <h1>{t('editor')}</h1>
          </div>
        </div>
        <div className='ce-top-actions'>
          <span className='ce-save-state'>
            <span />
            {t('localDemo')}
          </span>
          <span className='ce-save-state'>{t('multiSelect')}</span>

          <label className='ce-language'>
            <span className='ce-sr-only'>{t('language')}</span>
            <select
              value={i18n.language}
              onChange={(event) => void i18n.changeLanguage(event.target.value)}
              aria-label={t('language')}
            >
              <option value='en'>English</option>
              <option value='vi'>Vietnamese</option>
              <option value='zh'>Simplified Chinese</option>
            </select>
          </label>
        </div>
      </header>

      <section className='ce-toolbar' aria-label={t('editor')}>
        <div className='ce-room-title'>
          <span className='ce-room-dot' />
          <strong>{t('room')}</strong>
          <span className='ce-room-size'>20 × 12 m</span>
        </div>
        <div className='ce-toolbar-actions'>
          <button
            type='button'
            className='ce-tool-button'
            onClick={undo}
            disabled={history.past.length === 0}
            title={`${t('undo')} · Ctrl/Cmd+Z`}
          >
            <span aria-hidden='true'>↶</span>
            {t('undo')}
          </button>
          <button
            type='button'
            className='ce-tool-button'
            onClick={redo}
            disabled={history.future.length === 0}
            title={`${t('redo')} · Ctrl/Cmd+Y`}
          >
            <span aria-hidden='true'>↷</span>
            {t('redo')}
          </button>
          <span className='ce-toolbar-divider' />
          <button
            type='button'
            className={`ce-tool-button ${topDown ? '' : 'is-active'}`}
            onClick={() => setTopDown(false)}
            aria-pressed={!topDown}
          >
            <span aria-hidden='true'>◇</span>
            {t('view3d')}
          </button>
          <button
            type='button'
            className={`ce-tool-button ${topDown ? 'is-active' : ''}`}
            onClick={() => setTopDown(true)}
            aria-pressed={topDown}
          >
            <span aria-hidden='true'>▦</span>
            {t('plan')}
          </button>
        </div>
      </section>

      <div className='ce-workspace'>
        <aside className='ce-palette ce-panel'>
          <div className='ce-panel-heading'>
            <div>
              <p className='ce-eyebrow'>01 / PLACE</p>
              <h2>{t('addEquipment')}</h2>
            </div>
            <span className='ce-step-icon' aria-hidden='true'>
              ＋
            </span>
          </div>
          <div className='ce-palette-list'>
            {(Object.keys(EQUIPMENT) as LayoutItem['type'][]).map((type) => {
              const equipment = EQUIPMENT[type]
              return (
                <button
                  type='button'
                  className={`ce-palette-item ${placementType === type ? 'is-selected' : ''}`}
                  key={type}
                  onClick={() =>
                    setPlacementType((current) =>
                      current === type ? null : type
                    )
                  }
                  aria-pressed={placementType === type}
                >
                  <span
                    className={`ce-equipment-icon ce-icon-${type}`}
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
                      {equipment.width} × {equipment.depth} × {equipment.height}{' '}
                      m
                    </small>
                  </span>
                  <span className='ce-add-mark' aria-hidden='true'>
                    ＋
                  </span>
                </button>
              )
            })}
          </div>
          <div
            className={`ce-placement-tip ${placementType ? 'is-ready' : ''}`}
          >
            <span aria-hidden='true'>⌖</span>
            {placementType ? t('clickToPlace') : t('selectToEdit')}
          </div>
          <div className='ce-grid-note'>
            <span className='ce-grid-sample' aria-hidden='true' />
            <div>
              <strong>0.5 m</strong>
              <small>FIXED GRID</small>
            </div>
          </div>
        </aside>

        <section className='ce-stage ce-panel' aria-label={t('room')}>
          <div className='ce-stage-heading'>
            <div>
              <span className='ce-live-dot' />
              <strong>{topDown ? t('plan') : t('liveScene')}</strong>
              <span className='ce-stage-subtitle'>
                20 m × 12 m <span>·</span> {t('stageGrid')}
              </span>
            </div>
            <span className='ce-stage-count'>
              {t('itemsCount', {
                displayCount: items.length.toString().padStart(2, '0'),
              })}
            </span>
          </div>
          <div
            className={`ce-canvas-wrap ${placementType ? 'is-placing' : ''}`}
          >
            <RoomScene
              items={displayItems}
              selectedIds={selectedIds}
              violationIds={violationIds}
              previewItem={proposal?.ghost ?? null}
              placementType={placementType}
              topDown={topDown}
              onSelect={selectItem}
              onClearSelection={clearSelection}
              onPlace={(x, z) => placementType && addItem(placementType, x, z)}
              onDragStart={beginDrag}
              onDrag={updateDrag}
              onDragEnd={finishDrag}
            />
            {proposal ? (
              <div className='ce-preview-banner'>
                <span className='ce-preview-swatch' />
                <span>{t('previewing')}</span>
              </div>
            ) : null}
            <div className='ce-canvas-legend'>
              <span>
                <i className='ce-legend-normal' /> {t('equipmentLegend')}
              </span>
              <span>
                <i className='ce-legend-warning' /> {t('issueLegend')}
              </span>
              {proposal ? (
                <span>
                  <i className='ce-legend-preview' /> {t('previewLegend')}
                </span>
              ) : null}
            </div>
          </div>
          <div className='ce-rule-bar'>
            <div className='ce-rule-heading'>
              <span
                className={
                  violations.length ? 'ce-rule-icon is-warning' : 'ce-rule-icon'
                }
                aria-hidden='true'
              >
                {violations.length ? '!' : '✓'}
              </span>
              <div>
                <strong>{t('ruleCheck')}</strong>
                <small>
                  {violations.length
                    ? t('issueCount', { count: violations.length })
                    : t('allClear')}
                </small>
              </div>
            </div>
            <ul aria-label={t('ruleCheck')}>
              {violations.length ? (
                violations.map(({ first, second }) => (
                  <li key={`${first.id}-${second.id}`}>
                    {t('violation', {
                      first: t(EQUIPMENT[first.type].nameKey),
                      second: t(EQUIPMENT[second.type].nameKey),
                    })}
                  </li>
                ))
              ) : (
                <li className='ce-rule-clear'>{t('noViolations')}</li>
              )}
            </ul>
          </div>
        </section>

        <aside className='ce-inspector'>
          <section className='ce-panel ce-properties'>
            <div className='ce-panel-heading'>
              <div>
                <p className='ce-eyebrow'>02 / INSPECT</p>
                <h2>{t('properties')}</h2>
              </div>
              {selectedItems.length > 1 ? (
                <span className='ce-selection-count'>
                  {t('selectedCount', { count: selectedItems.length })}
                </span>
              ) : null}
            </div>

            {selectedItem ? (
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
                <div className='ce-position-fields'>
                  <label>
                    <span>X</span>
                    <input
                      type='number'
                      step={ROOM.cellSize}
                      value={selectedItem.x}
                      onChange={(event) =>
                        changePosition('x', Number(event.target.value))
                      }
                      aria-label={t('xPosition')}
                    />
                  </label>
                  <label>
                    <span>Z</span>
                    <input
                      type='number'
                      step={ROOM.cellSize}
                      value={selectedItem.z}
                      onChange={(event) =>
                        changePosition('z', Number(event.target.value))
                      }
                      aria-label={t('zPosition')}
                    />
                  </label>
                  <span className='ce-unit'>m</span>
                </div>
                <div className='ce-rotation-row'>
                  <span>{t('rotation')}</span>
                  <strong>{selectedItem.rotation}°</strong>
                  <button type='button' onClick={rotateSelection}>
                    {t('rotate')}
                  </button>
                </div>
                <button
                  type='button'
                  className='ce-danger-button'
                  onClick={removeSelection}
                >
                  <span aria-hidden='true'>×</span>
                  {t('delete')}
                </button>
              </div>
            ) : selectedItems.length > 1 ? (
              <div className='ce-multi-tools'>
                <p>{t('arrangeSelection')}</p>
                <button type='button' onClick={alignSelection}>
                  {t('alignLeft')}
                </button>
                <button
                  type='button'
                  onClick={distributeSelection}
                  disabled={selectedItems.length < 3}
                >
                  {t('distribute')}
                </button>
                <button type='button' onClick={rotateSelection}>
                  {t('rotate')}
                </button>
                <button type='button' onClick={toggleWires}>
                  {t(selectionWired ? 'disconnect' : 'connect')}
                </button>
                <button
                  type='button'
                  className='ce-danger-button'
                  onClick={removeSelection}
                >
                  {t('delete')}
                </button>
              </div>
            ) : (
              <div className='ce-empty-inspector'>
                <span aria-hidden='true'>⌖</span>
                <p>{t('nothingSelected')}</p>
                <small>{t('emptyInspectorHelp')}</small>
              </div>
            )}
          </section>

          <AssistantPanel
            items={items}
            violations={violations}
            proposalPending={proposal !== null}
            onReply={handleAssistantReply}
            onAccept={acceptProposal}
            onReject={() => setProposal(null)}
          />
        </aside>
      </div>

      <section className='ce-bottom-grid'>
        <div className='ce-panel ce-items-panel'>
          <div className='ce-panel-heading'>
            <div>
              <p className='ce-eyebrow'>04 / SCENE</p>
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
                    onClick={(event) => selectItem(item.id, event.shiftKey)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ')
                        selectItem(item.id, event.shiftKey)
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
            <button
              type='button'
              onClick={copySelection}
              disabled={selectedItems.length === 0}
            >
              {t('copy')}
            </button>
            <button
              type='button'
              onClick={pasteSelection}
              disabled={copiedItems.length === 0}
            >
              {t('paste')}
            </button>
          </div>
        </div>

        <div className='ce-panel ce-bom-panel'>
          <div className='ce-panel-heading'>
            <div>
              <p className='ce-eyebrow'>05 / PROCUREMENT</p>
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
                  <tr key={row.type}>
                    <td>
                      <span
                        className='ce-table-color'
                        style={{ backgroundColor: EQUIPMENT[row.type].color }}
                      />
                      {t(EQUIPMENT[row.type].nameKey)}
                    </td>
                    <td>{EQUIPMENT[row.type].sku}</td>
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
        </div>
      </section>

      <footer className='ce-footer'>
        <span>{t('keyboardHelp')}</span>
        <span>GRID · 0.5 m</span>
      </footer>
      <div className='ce-sr-only' aria-live='assertive'>
        {announcement}
      </div>
    </main>
  )
}
