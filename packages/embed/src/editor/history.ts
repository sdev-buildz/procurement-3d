import type { LayoutItem } from './types'

/** Previous, current, and redo-ready room layouts. */
export type LayoutHistory = {
  /** Layout snapshots that can be restored by undo. */
  past: LayoutItem[][]
  /** Active layout displayed by all editor panels. */
  present: LayoutItem[]
  /** Layout snapshots that can be restored by redo. */
  future: LayoutItem[][]
}

/** State transitions supported by the editor's undo/redo history. */
export type LayoutHistoryAction =
  | {
      /** Store an edited layout and clear the redo stack. */
      type: 'commit'
      /** Layout produced by the edit. */
      items: LayoutItem[]
    }
  | {
      /** Restore the latest previous layout. */
      type: 'undo'
    }
  | {
      /** Restore the next undone layout. */
      type: 'redo'
    }

/**
 * Creates a history stack from the initial room layout.
 * @param items - Initial room items.
 * @returns A history with no undo or redo snapshots.
 */
export function createLayoutHistory(items: LayoutItem[]): LayoutHistory {
  return { past: [], present: items, future: [] }
}

/**
 * Applies one undoable layout transition.
 * @param state - Current history stacks.
 * @param action - Requested history transition.
 * @returns Updated stacks, or the unchanged state when no snapshot is available.
 */
export function layoutHistoryReducer(
  state: LayoutHistory,
  action: LayoutHistoryAction
): LayoutHistory {
  switch (action.type) {
    case 'commit':
      return {
        past: [...state.past, state.present],
        present: action.items,
        future: [],
      }
    case 'undo': {
      const previous = state.past.at(-1)
      if (!previous) return state
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      }
    }
    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      }
    }
  }
}
