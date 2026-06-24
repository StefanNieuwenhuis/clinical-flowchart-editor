---
name: Vibe-Coding Workflow
---

# Vibe-Coding Workflow Rules

## Response style
- In planning and scoping turns, respond with bullet lists only — no code blocks.
- Only generate code when explicitly asked with words like "implement", "write", or "generate".
- Never show code examples while explaining a plan or asking clarifying questions.

## Before writing any code
1. Read the relevant extension checklist in `02-architecture.md` for the change type.
2. Identify which store actions need to change vs. which need to be added.
3. Identify which existing tests need to be updated.

## Code generation guidelines
- Generate complete, runnable files — not snippets with `// ... rest of file`.
- After generating a component, always generate its test file as well.
- When modifying a store action, check all callers in components/hooks and update them.
- When adding a new utility function to `utils/`, add it to the relevant index if one exists.

## Branch & commit discipline
- Create a branch for every change, always branching from `main`: `git checkout main && git fetch && git pull && git checkout -b <type>/<action>/<scope>/<short-description>`
  Example: `feat/add/nodes/decision-node`, `fix/update/nodes/decision-node`
- One logical change per commit.
- Commit message format: `<type>(<scope>): <description>`
  Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  Example: `feat(nodes): add DecisionNode type with diamond shape`
- Never commit directly to `main`.

## Do NOT
- Do not add new npm packages without asking first.
- Do not change the Vite or TypeScript config unless asked.
- Do not switch from pnpm to npm.
- Do not remove `@vercel/analytics` or `@vercel/speed-insights` — they are needed for production.
- Do not add a backend or API routes — this is a static app.