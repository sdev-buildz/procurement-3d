import { type LayoutItem } from '../items'

/**
 * Suggestion from an assistant
 */
export type AssistantProposal = {
  ghosts: LayoutItem[]
}

/** Proposed transform for one existing piece of equipment. */
export type AssistantProposedItem = Pick<
  LayoutItem,
  'id' | 'x' | 'z' | 'rotation'
>

/**
 * Builds preview items for a set of proposed transforms.
 * @param items - Current room contents.
 * @param proposedItems - Proposed transforms for existing items.
 * @returns Preview items, or null if an ID is missing or repeated.
 */
export function createProposalGhosts(
  items: LayoutItem[],
  proposedItems: AssistantProposedItem[]
): LayoutItem[] | null {
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const proposedIds = new Set<string>()
  const ghosts: LayoutItem[] = []

  for (const proposedItem of proposedItems) {
    const item = itemsById.get(proposedItem.id)
    if (!item || proposedIds.has(proposedItem.id)) return null
    proposedIds.add(proposedItem.id)
    ghosts.push({ ...item, ...proposedItem })
  }

  return ghosts.length ? ghosts : null
}

/** A machine-readable layout edit proposed alongside the assistant's message. */
export type AssistantProposedChange = {
  /** Supported scene operation. Add a new action before introducing other edits. */
  action: 'move_item'
  /** ID of an existing layout item; never use a display name as an identifier. */
  itemId: string
  /** Target center position in meters; the editor snaps it to the room grid. */
  target: {
    /** Target coordinate along the room's X axis, in meters. */
    x: number
    /** Target coordinate along the room's Z axis, in meters. */
    z: number
  }
  /** Short, user-facing explanation of why the change is suggested. */
  rationale: string
}

/**
 * Structured response contract for an assistant turn.
 *
 * Keep this shape JSON-serializable so a mock response can be replaced by an
 * API response without coupling the panel to a particular model provider.
 */
export type AssistantReply = {
  /** Natural-language answer displayed in the streaming chat transcript. */
  message: string
  /** A proposed edit, or null when the assistant is only answering a question. */
  proposedChange: AssistantProposedChange | null
}

/** A clickable example conversation shown before the user starts a chat. */
export type SampleAssistantConversation = {
  /** Stable identifier for selecting the sample behavior. */
  id: 'rule-violations' | 'spacing' | 'cost'
  /** Translation key for the sample user's prompt. */
  promptKey: string
  /** Translation key for the structured assistant response message. */
  messageKey: string
  /** Translation key for the proposed change's rationale. */
  rationaleKey: string
}

/** Suggested prompts that each produce a previewable scene edit. */
export const sampleAssistantConversations: SampleAssistantConversation[] = [
  {
    id: 'rule-violations',
    promptKey: 'sampleViolationsPrompt',
    messageKey: 'sampleViolationsAnswer',
    rationaleKey: 'sampleViolationsRationale',
  },
  {
    id: 'spacing',
    promptKey: 'sampleSpacingPrompt',
    messageKey: 'sampleSpacingAnswer',
    rationaleKey: 'sampleSpacingRationale',
  },
  {
    id: 'cost',
    promptKey: 'sampleCostPrompt',
    messageKey: 'sampleCostAnswer',
    rationaleKey: 'sampleCostRationale',
  },
]

/**
 * Example response shape; field comments in the type above document each value.
 */
export const assistantReplyExample: AssistantReply = {
  message: 'I can move the cabinet to improve the spacing.',
  proposedChange: {
    action: 'move_item',
    itemId: 'cabinet-1',
    target: { x: 2, z: -1.5 },
    rationale: 'This gives nearby equipment more clearance.',
  },
}
