---
name: Project Identity
---

# Clinical Flowchart Editor — Project Context

This is a React 19 + TypeScript 6 single-page application for building and editing
clinical decision flowcharts (beslisbomen) for Dutch-speaking healthcare workers.
It runs entirely in the browser with no backend.

## Core constraints
- NO backend, NO database, NO authentication — client-side only.
- Persistence: IndexedDB via Dexie for local library management;
  LZ-string-compressed URL hash for zero-backend sharing.
- Future: a `StorageAdapter` interface is planned for Supabase migration.
  Do NOT couple storage logic directly to Dexie; always go through the adapter interface.
- The UI language is Dutch for end-user-facing text; code and comments are English.
- Target users are clinical professionals — clarity and correctness of flowchart
  logic is more important than flashy UI.

## Package manager
Always use `pnpm`. Never suggest `npm install` or `yarn add`.

## Key dependencies
- React 19, react-dom 19
- TypeScript ~6.0
- Vite 8, @vitejs/plugin-react
- Tailwind CSS 4 (via @tailwindcss/vite — no postcss config needed)
- Zustand 5 (stores only, no Context API for global state)
- Vitest 4 + @vitest/coverage-v8, @testing-library/react, jsdom
- lucide-react for icons
- clsx + tailwind-merge for conditional classes

# Documentation Resources

For framework-specific questions, refer to:

- React: https://react.dev/reference/react
- Zustand: https://zustand.docs.pmnd.rs/reference
- Tailwind CSS: https://tailwindcss.com/docs
- Vitest: https://vitest.dev/api

Always cite documentation when explaining concepts.
