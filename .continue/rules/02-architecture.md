---
name: Architecture & State Rules
---

# Architecture Rules

## Folder map

src/
├── App.tsx                        ← top-level composition only
├── layouts/AppLayout.tsx          ← page shell (topbar, sidepanels, canvas, statusbar)
├── features/
│   └── flowchart/
│       ├── components/            ← canvas + panel UI
│       ├── hooks/                 ← pointer/viewport interaction logic
│       ├── state/                 ← Zustand stores
│       ├── model/                 ← domain types, node registry, initial doc
│       └── utils/                 ← geometry, validation, document helpers
└── shared/
└── utils/                     ← generic cross-feature utilities


## State ownership — NON-NEGOTIABLE
- `flowchartStore` is the **single source of truth** for document data
  (nodes, edges, selection, viewport).
- Mutate flowchart data ONLY through store actions:
  `addNodeOfTypeAt`, `moveNode`, `updateNode`, `setViewport`, etc.
- Never mutate store state via ad-hoc `useState` in components.
- `canvasCommandStore` is for **transient UI command wiring only**
  (e.g., left panel triggering canvas-centred node creation).
- Derived/display-only values live in components or hooks.
- Persistence-worthy state lives in stores.

## Adding a new node type (extension checklist)
1. Extend `NodeType` in `src/features/flowchart/model/types.ts`
2. Add metadata/defaults in `src/features/flowchart/model/nodeTypes.ts`
3. Update defaults in `src/features/flowchart/utils/createNode.ts` if needed
4. Add or update tests for type rendering and creation flow

## Canvas interaction extension checklist
1. Pan/zoom → `src/features/flowchart/hooks/useCanvasPanZoom.ts`
2. Node dragging → `src/features/flowchart/hooks/useNodeDrag.ts`
3. Always cover interaction thresholds and clamp behaviour with tests

## Validation extension checklist
1. Rules → `src/features/flowchart/utils/validateFlowchart.ts`
2. Surface outcomes → `src/features/flowchart/components/status-bar/StatusBar.tsx`
3. Add tests for both utility output and status presentation