import type { EquipmentType } from '../types'

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
  id: 'spacing' | 'drive' | 'cabinet'
  /** Translation key for the sample user's prompt. */
  promptKey: string
  /** Translation key for the structured assistant response message. */
  messageKey: string
  /** Translation key for the proposed change's rationale. */
  rationaleKey: string
  /** Equipment category to move, or null to use the closest rule violation. */
  equipmentType: EquipmentType | null
}

/** Suggested prompts that each produce a previewable scene edit. */
export const sampleAssistantConversations: SampleAssistantConversation[] = [
  {
    id: 'spacing',
    promptKey: 'sampleSpacingPrompt',
    messageKey: 'sampleSpacingAnswer',
    rationaleKey: 'sampleSpacingRationale',
    equipmentType: null,
  },
  {
    id: 'drive',
    promptKey: 'sampleDrivePrompt',
    messageKey: 'sampleDriveAnswer',
    rationaleKey: 'sampleDriveRationale',
    equipmentType: 'drive',
  },
  {
    id: 'cabinet',
    promptKey: 'sampleCabinetPrompt',
    messageKey: 'sampleCabinetAnswer',
    rationaleKey: 'sampleCabinetRationale',
    equipmentType: 'cabinet',
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
