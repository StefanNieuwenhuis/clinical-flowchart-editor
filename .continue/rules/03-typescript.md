---
name: TypeScript & React Patterns
globs: ["**/*.ts", "**/*.tsx"]
---

# TypeScript & React Rules

## TypeScript
- Strict mode is ON. No `any`, no `@ts-ignore` without a comment explaining why.
- Use `interface` for object shapes; `type` for unions, intersections, and aliases.
- Prefer `readonly` arrays and properties where data should not be mutated.
- Use discriminated unions for node/edge types — do not use string checks on raw strings.
- Export types from `model/types.ts`; do not scatter type definitions across components.

## React
- React 19: use the new JSX transform (no `import React` needed).
- Functional components only — no class components.
- Prefer named exports for components; default export only for page-level compositions.
- Keep components small and single-responsibility.
- Use `clsx` + `tailwind-merge` (`cn()` helper) for conditional class names.
  Never concatenate Tailwind classes with string interpolation.
- Icons: `lucide-react` only. Do not add other icon libraries.

## Tailwind CSS 4
- Tailwind 4 uses `@import "tailwindcss"` — no `@tailwind base/components/utilities` directives.
- Config lives in `vite.config.ts` via `@tailwindcss/vite`. Do not create a `tailwind.config.js`.
- Use Tailwind utility classes. Do not write custom CSS unless absolutely unavoidable.

## Zustand stores
- Define stores in `src/features/flowchart/state/`.
- Use the `create` function with explicit type annotation on the store interface.
- Expose only actions and selectors — no direct state mutation from outside the store.
- Use shallow selectors to avoid unnecessary re-renders.

## File naming
- Components: PascalCase (`FlowchartCanvas.tsx`)
- Hooks: camelCase prefixed with `use` (`useNodeDrag.ts`)
- Utilities: camelCase (`validateFlowchart.ts`)
- Types: PascalCase for types/interfaces inside `types.ts`