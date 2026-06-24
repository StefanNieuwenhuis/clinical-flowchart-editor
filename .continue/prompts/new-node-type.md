---
name: new-node-type
description: Scaffold a complete new node type end-to-end
---

I want to add a new node type called `{input:nodeTypeName}`.

Please:
1. Extend `NodeType` enum in `src/features/flowchart/model/types.ts`
2. Add metadata entry in `src/features/flowchart/model/nodeTypes.ts`
   (label, description, default width/height, default color)
3. Update `src/features/flowchart/utils/createNode.ts` with correct defaults
4. Create the React component in `src/features/flowchart/components/`
5. Write a complete Vitest test file for the new node type
6. Tell me what validation rules (if any) should be added in `validateFlowchart.ts`

Follow all rules from the project's `.continue/rules/` files.
Please provide a detailed plan and code snippets to ensure clarity and completeness. Thank you!