/* eslint jsdoc/require-jsdoc: off */
import type { Dpr } from '@react-three/fiber'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './ConfigEditor.css'
import { AssistantPanel } from './editor/assistant/AssistantPanel'
import type { AssistantProposal } from './editor/assistant/assistantReply'
import { useDrag } from './editor/hooks/useDrag'
import { useHistory } from './editor/hooks/useHistory'
import { useViolations } from './editor/hooks/useViolations'
import type { ItemType, LayoutItem } from './editor/items'
import { ROOM } from './editor/items'
import { constrainPosition } from './editor/layout'
import { BomPanel } from './editor/panels/BomPanel'
import { CatalogPanel } from './editor/panels/CatalogPanel'
import { ItemsInScene } from './editor/panels/ItemsInScene'
import { PerformancePanel } from './editor/panels/PerformancePanel'
import { SelectionInspector } from './editor/panels/SelectionInspector'
import { StageFor3dViewer } from './editor/panels/StageFor3dViewer'
import { ToolBar } from './editor/panels/ToolBar'
import { TopBar } from './editor/panels/TopBar'

function makeId(item: ItemType): string {
  return `${item.name}-${crypto.randomUUID()}`
}

/**
 * The workspace with 3D view, and other supporting panels.
 */
export function ConfigEditor(): ReactElement {
  const { t } = useTranslation()
  const historyState = useHistory()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [itemPlaced, setPlacementType] = useState<ItemType | null>(null)
  const [topDown, setTopDown] = useState(false)
  const [copiedItems, setCopiedItems] = useState<LayoutItem[]>([])
  const [proposal, setProposal] = useState<AssistantProposal | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [isPerfPanelOpen, setIsPerfPanelOpen] = useState<boolean>(false)

  const [dpr, setDpr] = useState<Dpr>([1, 1.5])

  const items = historyState.history.present

  const { draggedItem, dragPreview, dragHandlers } = useDrag({
    items,
    onCommit: historyState.commitItems,
    onPositionChange: (item) =>
      setAnnouncement(`${t('position')} ${item.x}, ${item.z}`),
  })

  /** It includes preview of item's new position shown when dragging. */
  const itemsDisplayed: LayoutItem[] = dragPreview
    ? items.map((item) => (item.id === dragPreview.id ? dragPreview : item))
    : items

  const violations = useViolations(itemsDisplayed)

  /**
   * The currently selected items. Users can select items by clicking on them.
   * Multi-selection is supported by holding down the Shift key while clicking on items.
   */
  const selectedItems = items.filter((item) => selectedIds.has(item.id))
  /** The currently selected item, if there is only one selected. */
  const selectedItem =
    selectedItems.length === 1 ? (selectedItems[0] ?? null) : null

  /**
   * @param id - the id of the item to select
   * @param extend - if true (holding Shift while clicking), the selection is extended to include the item,
   *  otherwise the selection is replaced with the item
   */
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

  /**
   * Applies the provided callback to every selected item.
   * The callback can update an item's position, rotation, etc....
   * @param update - the callback
   */
  const updateSelected = (update: (item: LayoutItem) => LayoutItem) => {
    if (selectedIds.size === 0) return
    historyState.commitItems(
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
    historyState.commitItems(
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
      copiedItems.map((item) => [item.id, makeId(item.item)])
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
    historyState.commitItems([...items, ...pasted])
    setSelectedIds(new Set(pasted.map(({ id }) => id)))
    setAnnouncement(t('paste'))
  }

  const alignSelection = () => {
    if (selectedItems.length < 2) return
    const leftmost = Math.min(...selectedItems.map(({ x }) => x))
    historyState.commitItems(
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
    historyState.commitItems(
      items.map((item) => {
        const x = positions.get(item.id)
        return x === undefined ? item : { ...item, x }
      })
    )
  }

  const addItem = (item: ItemType, x: number, z: number) => {
    const layoutItem: LayoutItem = {
      id: makeId(item),
      item: item,
      ...constrainPosition({ item, id: '', x: 0, z: 0, rotation: 0 }, x, z),
      rotation: 0,
    }
    historyState.commitItems([...items, layoutItem])
    setSelectedIds(new Set([layoutItem.id]))
    setPlacementType(null)
    setAnnouncement(t('placedAnnouncement', { item: t(item.name) }))
  }

  const changePosition = (axis: 'x' | 'z', value: number) => {
    if (!selectedItem || !Number.isFinite(value)) return
    const position = constrainPosition(
      selectedItem,
      axis === 'x' ? value : selectedItem.x,
      axis === 'z' ? value : selectedItem.z
    )
    historyState.commitItems(
      items.map((item) =>
        item.id === selectedItem.id ? { ...item, ...position } : item
      )
    )
  }

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
        if (event.shiftKey) historyState.redo()
        else historyState.undo()
      } else if (modifier && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        historyState.redo()
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
    historyState.redo,
    removeSelection,
    historyState.undo,
  ])

  return (
    <main className='ce-shell'>
      <TopBar />

      <ToolBar {...historyState} topDown={topDown} setTopDown={setTopDown} />

      <div className='ce-workspace'>
        <CatalogPanel
          itemPlaced={itemPlaced}
          onSelectItem={(item: ItemType) =>
            setPlacementType((current) =>
              current?.id === item.id ? null : item
            )
          }
        />
        <StageFor3dViewer
          itemsDisplayed={itemsDisplayed}
          selectedIds={selectedIds}
          previewItem={proposal?.ghost ?? null}
          itemPlaced={itemPlaced}
          topDown={topDown}
          onSelect={selectItem}
          onClearSelection={clearSelection}
          onPlace={(x, z) => itemPlaced && addItem(itemPlaced, x, z)}
          dragHandlers={dragHandlers}
          draggingId={draggedItem.current?.id}
          proposal={proposal}
          violations={violations}
          dpr={dpr}
        />

        <aside className='ce-right-panels'>
          <PerformancePanel
            commitItems={historyState.commitItems}
            items={items}
            dpr={dpr}
            setDpr={setDpr}
            open={isPerfPanelOpen}
            setIsOpen={setIsPerfPanelOpen}
          />
          <SelectionInspector
            items={items}
            selectedItems={selectedItems}
            selectedItem={selectedItem}
            isPerfPanelOpen={isPerfPanelOpen}
            setIsPerfPanelOpen={setIsPerfPanelOpen}
            onPositionChange={changePosition}
            onRotate={rotateSelection}
            onDelete={removeSelection}
            onAlign={alignSelection}
            onDistribute={distributeSelection}
            commitItems={historyState.commitItems}
          />

          <AssistantPanel
            items={items}
            violations={violations}
            proposalPending={proposal !== null}
            onReject={() => setProposal(null)}
            proposal={proposal}
            setProposal={setProposal}
            historyState={historyState}
            setSelectedIds={setSelectedIds}
            setAnnouncement={setAnnouncement}
            isPerfPanelOpen={isPerfPanelOpen}
            setIsPerfPanelOpen={setIsPerfPanelOpen}
          />
        </aside>
      </div>
      <div className='ce-bottom-grid'>
        <ItemsInScene
          items={items}
          selectedIds={selectedIds}
          copiedItemsCount={copiedItems.length}
          onSelectItem={selectItem}
          onCopy={copySelection}
          onPaste={pasteSelection}
        />
        <BomPanel items={items} />
      </div>

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
