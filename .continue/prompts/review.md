---
name: review
description: Review selected code against project conventions
---

Review the following code carefully against the project rules.

Check for:
- Violations of state ownership rules (direct mutation, bypassing store actions)
- TypeScript strictness issues (any, non-null assertions without comment, implicit any)
- Missing or wrong test coverage for the change
- Tailwind 4 compatibility issues
- Accessibility issues in JSX (missing aria labels, keyboard nav)
- Anything inconsistent with the project's extension checklists

Be specific. Reference file paths and function names. Prioritize by severity.
---