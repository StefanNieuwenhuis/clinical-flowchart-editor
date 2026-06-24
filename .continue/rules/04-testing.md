---
name: Testing Rules
globs: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"]
---

# Testing Rules

## Framework
- Vitest 4 + @testing-library/react + @testing-library/user-event + jsdom.
- Use `userEvent` (from `@testing-library/user-event`) for interactions — NOT `fireEvent`.
- Do NOT mock the module under test.
- Do NOT test implementation details; test observable behaviour.

## Test layers (from README)
1. **Utility tests** — pure logic: geometry, validation, viewport math, node creation.
2. **Hook tests** — interaction semantics: dragging, panning, zooming.
3. **Component tests** — integration: controls, panels, status, canvas wiring.

## Naming & organisation
- Co-locate tests with the file under test: `createNode.test.ts` next to `createNode.ts`.
- Use named constants for repeated values instead of inline literals.
- Test descriptions should read as behaviour specifications:
  `it('moves node to clamped position when dragged beyond canvas bounds', ...)`

## Coverage
- Run coverage: `pnpm test:coverage`
- New features must ship with tests covering: happy path, error/edge cases, boundary conditions.

## What to test for new node types
- Type is registered in `nodeTypes.ts` with correct metadata
- `createNode` returns the right shape for the new type
- Status bar correctly reflects validation results for the new type