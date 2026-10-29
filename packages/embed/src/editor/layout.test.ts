import { describe, expect, it } from 'vitest'
import {
  constrainPosition,
  createBillOfMaterials,
  findRuleViolations,
  snapToGrid,
} from './layout'
import { createLayoutHistory, layoutHistoryReducer } from './history'
import {
  assistantReplyExample,
  sampleAssistantConversations,
} from './assistant/assistantReply'
import type { LayoutItem } from './types'

const items: LayoutItem[] = [
  { id: 'drive-1', type: 'drive', x: -0.5, z: 0, rotation: 0 },
  { id: 'cabinet-1', type: 'cabinet', x: 0, z: 0, rotation: 0 },
  { id: 'panel-1', type: 'panel', x: 5, z: 0, rotation: 0 },
]

describe('layout helpers', () => {
  it('snaps positions to half-meter cells and keeps equipment inside the room', () => {
    expect(snapToGrid(1.24)).toBe(1)
    expect(constrainPosition(items[0]!, 20, -20)).toEqual({ x: 9.5, z: -5.5 })
  })

  it('reports each pair closer than 0.6 meters', () => {
    expect(findRuleViolations(items)).toHaveLength(1)
    expect(findRuleViolations([items[0]!, items[2]!])).toHaveLength(0)
  })

  it('counts quantities and prices from the current layout', () => {
    expect(createBillOfMaterials(items)).toEqual([
      { type: 'drive', quantity: 1, unitPrice: 2480 },
      { type: 'cabinet', quantity: 1, unitPrice: 1890 },
      { type: 'panel', quantity: 1, unitPrice: 960 },
    ])
  })
})

describe('layout history', () => {
  it('undoes and redoes edits and clears redo after a new edit', () => {
    const changed = [
      ...items,
      { id: 'panel-2', type: 'panel' as const, x: 2, z: 2, rotation: 0 },
    ]
    const committed = layoutHistoryReducer(createLayoutHistory(items), {
      type: 'commit',
      items: changed,
    })

    const undone = layoutHistoryReducer(committed, { type: 'undo' })
    const redone = layoutHistoryReducer(undone, { type: 'redo' })
    const branched = layoutHistoryReducer(undone, { type: 'commit', items: [] })

    expect(undone.present).toBe(items)
    expect(redone.present).toBe(changed)
    expect(branched.future).toEqual([])
  })
})

describe('assistant response contract', () => {
  it('provides a JSON-serializable example with an explicit proposed edit', () => {
    const response: unknown = JSON.parse(JSON.stringify(assistantReplyExample))

    expect(response).toEqual(assistantReplyExample)
  })

  it('offers sample prompts that can produce proposals for each equipment type', () => {
    expect(sampleAssistantConversations.map(({ id }) => id)).toEqual([
      'spacing',
      'drive',
      'cabinet',
    ])
    expect(
      sampleAssistantConversations
        .map(({ equipmentType }) => equipmentType)
        .filter((type) => type !== null)
    ).toEqual(['drive', 'cabinet'])
  })
})
