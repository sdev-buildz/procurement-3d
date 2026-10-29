# 3D electrical-room editor

This package exports `ConfigEditor`, a self-contained React editor used by the
procurement preview route at `/3d-editor`.

## Structure

- `src/ConfigEditor.tsx` composes the editor panels and owns scene, selection,
  history, and assistant state.
- `src/ConfigEditor.css` contains the responsive, editor-scoped styles.
- `src/editor/types.ts` defines the room, equipment catalog, and layout types.
- `src/editor/layout.ts` contains the grid, spacing-rule, and BOM calculations.
- `src/editor/history.ts` keeps layout changes undoable and redoable.
- `src/editor/assistant/AssistantPanel.tsx` contains the isolated, streaming
  mock-assistant panel and clickable sample conversations that preview layout
  changes.
- `src/editor/assistant/assistantReply.ts` defines and documents the JSON reply
  contract and exports an example.
- `src/editor/scene/RoomScene.tsx` renders the room and equipment with
  React Three Fiber.
- `src/editor/i18n.ts` initializes English and Spanish UI translations with
  i18next and react-i18next.

## Editing

Choose an equipment type, then click a floor cell to place it. Drag equipment
to move it, or select it to edit its position, rotation, and connections.
Shift-click selects multiple items; the selection tools can align, distribute,
rotate, connect, copy, and paste equipment. The top-down plan and 3D camera
share the same layout state.

The assistant is intentionally mocked: it streams a locally generated answer
and shows a proposed move as a ghost item. Accepting the suggestion is a normal
undoable layout edit.

### Assistant reply contract

The assistant replies with a `message` and a nullable `proposedChange`. The
proposed operation currently supports moving one existing item. Coordinates
are in meters and are snapped to the room grid before previewing. `itemId`
must refer to an item in the current layout. The TypeScript type comments in
`src/editor/assistant/assistantReply.ts` document each field.

This JSONC example shows the response shape; remove the comments before parsing
it as strict JSON:

```jsonc
{
  "message": "I can move the cabinet to improve the spacing.",
  "proposedChange": {
    "action": "move_item", // The supported scene operation.
    "itemId": "cabinet-1", // ID of the existing layout item.
    "target": {
      "x": 2, // Target X coordinate in meters.
      "z": -1.5, // Target Z coordinate in meters.
    },
    "rationale": "This gives nearby equipment more clearance.",
  },
}
```

Use `"proposedChange": null` for a response that only answers a question.
The exported `assistantReplyExample` is a valid, comment-free object suitable
for JSON serialization.

Keyboard shortcuts: arrow keys move the selection by one cell, Delete removes
it, Ctrl/Cmd+Z undoes, Ctrl/Cmd+Y redoes, and Ctrl/Cmd+C/V copy and paste.

Run the layout and history unit tests with `pnpm --filter @packages/embed-3d
test`.
