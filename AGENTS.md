## Mission
Build a minimal, production-minded **invoice editor**: list, filter, create, **finalize**, **delete**. Prioritize correctness, UX states, and tests over visual polish.

## Architectural Guardrails
- **Use the provided OpenAPI client** via `useApi()`; do NOT bypass it with raw fetch/axios.
- **Auth**: `ApiProvider` must include `X-SESSION` token (local dev only). Never commit secrets in tests; e2e will stub network.
- **Data fetching**: colocate calls near features; avoid global state libs. Prefer simple component state.
- **Filtering**: build the `filter` param as a JSON array of `{ field, operator, value }` (operators: `eq`, `gteq`, `in`, etc.). :contentReference[oaicite:7]{index=7}
- **Finalization semantics**: once an invoice is finalized it cannot be edited. Reflect this in UI/logic. :contentReference[oaicite:8]{index=8}

## Design Principles (Pennylane → Operationalized)
- Challenge the Basics
  - Ship the smallest thing that solves the user’s current job. Avoid add-ons (avatars, complex sorting, bulk modes) until a real need surfaces.
  - Prefer clear, textual information over decorative UI. Keep the table lean: only must-have columns and actions.
  - Don’t pre-optimize navigation. Start with a single list + focused filters (date from, invoice number). Add tabs/pagination only if data proves it.
  - Measure friction through feedback and logs; iterate with evidence.
- Empathize Relentlessly
  - Design for stressed accountants: predictable states, safe actions, and clear copy. Preserve user input on errors; never lose data.
  - Errors use human language (“Couldn’t finalize — already locked”). Log details to console in dev, never expose tokens.
  - Respect immutability: once finalized, hide edit affordances to prevent accidental changes.
  - Keyboard-first flows: focus management, ESC behavior, accessible labels by default.
- Embrace Speed
  - Favor small PRs that complete end-to-end slices (UI + hook + test). Learn from usage quickly.
  - Co-locate data calls inside feature hooks/components; avoid global state. Keep types strict at the API edge.
  - Mock the network in unit/e2e tests to keep feedback fast and deterministic.
  - When safe, use optimistic updates with rollback (finalize/delete) for perceived speed.
- Build Excitement
  - Advocate long-term wins (autosave, bulk actions, PDF preview) but keep them in `FUTURE_WORK.md` until justified.
  - Micro-success feedback (toasts, subtle state changes) helps users feel progress.
  - Prefer clarity over flash: great copy and resilient flows create trust and delight.

## Code Quality
- **TypeScript** strict; avoid `any`. Narrow types at the edge (API).
- **Naming**: domain-first (Invoice, InvoiceLine, FinalizeInvoiceDialog).
- **Components**: small, focused, accessible by default (labels, roles).
- **File structure**:
  - Single-file components: `src/app/features/ComponentName.tsx` (no folder)
  - Multi-file components: `src/app/features/ComponentName/ComponentName.tsx` with `index.tsx` for barrel export only
  - Use `index.tsx` only for exports, never for component implementation
- **Side effects**: isolate in hooks (`useInvoices`, `useFinalizeInvoice`), return `{ run, status, error }`.
- **Error handling**: user-facing messages + logs in dev console; never swallow errors.
- **Use existing libraries**: Leverage already-installed dependencies (React-Bootstrap, react-table, etc.) before writing custom implementations or adding new packages.
- **No needless deps**: use the skeleton's deps; any new dep must be justified in README.

## Financial Accuracy & Validation
### Decimal Precision
- **Always use 2 decimal places** for currency display and storage
- **Avoid floating point errors**: use libraries like decimal.js for calculations if needed
- **Round at display time**, not during intermediate calculations
- **Test edge cases**: 0.1 + 0.2, large numbers, negative values

### Validation Principles
- **Validate on blur** (when user leaves field), not while typing
- **Inline errors** next to fields with:
  - Red border and error icon (use both for accessibility)
  - Complete sentences: "Invoice amount must be greater than 0"
  - Positive language: "Please enter a valid email address"
  - Specific guidance: "Use format: YYYY-MM-DD"
- **Field-level validation**:
  - Required fields: clear asterisk (*) and aria-required
  - Numeric fields: prevent negative where inappropriate
  - Date fields: validate format and logical ranges
  - Currency: proper formatting with locale (Intl.NumberFormat)
- **Form-level validation**:
  - At least one line item required
  - Total calculations must match sum of lines
  - Business rules (e.g., invoice date ≤ due date)

### Error Recovery
- **Never lose user input** on validation failure
- **Local storage backup** for form data
- **Conflict resolution**: When concurrent edits detected, let user choose
- **Network resilience**:
  - Queue failed requests for retry
  - Show connection status
  - Differentiate between validation errors (user fixable) and system errors (retry)

## Testing Strategy
- **Unit/Integration (Jest + RTL)**
  - Cover the **happy path** per story + at least one **error** path.
  - **NEVER use `jest.mock()` to mock modules**. Use **MSW (Mock Service Worker)** to intercept network requests instead.
    - MSW provides realistic network mocking that works the same way in tests, dev, and storybook.
    - See: https://testing-library.com/docs/react-testing-library/example-intro/#mock
    - Example: Mock API responses with `server.use(http.get('/api/invoices', () => HttpResponse.json({ invoices: [] })))`
  - Only exception: mock child React components in isolated unit tests (e.g., `jest.mock('./ChildComponent')` to test parent logic).
  - Assert **filter** param structure and action calls via MSW request handlers.
- Prioritize business-critical path coverage over raw percentage targets; invest first in tests that protect customer-impacting flows.
- **E2E (Playwright)**  
  - **Mock network with `page.route`** for `https://jean-test-api.herokuapp.com/**`. Provide fixtures per scenario.  
  - Flows to cover:
    1) Load list (200) → rows visible.  
    2) Filter by date and invoice number → fewer rows. :contentReference[oaicite:9]{index=9}  
    3) Finalize success → row reflects finalized, action disappears. :contentReference[oaicite:10]{index=10}  
    4) Finalize conflict (already finalized) → neutral toast, refresh.  
    5) Delete draft success → row removed.  
    6) Delete finalized returns 409 → error toast; row intact. :contentReference[oaicite:11]{index=11}  
  - Accessibility smoke: dialog focus trap, escape behavior, button labels.
- **What not to do**: brittle snapshots; network‑dependent e2e; testing implementation details.

### Principle Hooks for Tests
- “Challenge the Basics”: assert only essential UI exists (no hidden edit affordances on finalized, no unused filters).
- “Empathize”: verify error messages are actionable and input is preserved on failure.
- “Embrace Speed”: keep tests focused on business-critical flows with fast, deterministic mocks.
- “Build Excitement”: confirm success feedback is visible and non-blocking.

## Pull Requests & CI
- **PR template**: problem, solution, screenshots (states), tests added, trade‑offs.
  - Add a short "Principles Applied" note (which principles, how) and "User Impact" summary (who benefits, stress reduced).
- **Checks**: typecheck, lint, tests. One `yarn ci` script should run all.
- **Committing**:
  - **CRITICAL: NEVER create commits without explicit user permission. Always ask first and wait for approval.**
  - Do NOT include "Generated with Claude Code" or "Co-Authored-By: Claude" footers in commit messages

## Performance & UX
- Optimistic updates only where safe (finalize/delete can be optimistic with rollback).
- Use `Intl.NumberFormat` for money; display ISO date with a human format.
- **Auto-save**: Debounced at 30-60 second intervals with status indicators
- **Loading states**: Skeleton loaders for tables, inline spinners for actions
- **Focus management**: Return focus after dialogs, trap focus in modals

## Documentation
- **README**: run/test instructions, architecture map, API usage (`useApi`), filters examples.  
- **FUTURE_WORK.md**: 3–5 features with *why / prototype / missing*.

## Non-Goals (until justified by user needs)
- Avatars, tag colors, or heavy visual theming.
- Inline editing for finalized invoices; any edit affordance after finalization.
- Complex filter builders beyond the documented date-from + invoice number.
- Server-side pagination/sorting before real data sizes demand it.

## Authoring Stories (checklist)
- Start with the user’s stress/context and the minimal job to be done.
- Define happy path + one realistic failure that preserves user input.
- Specify accessible states (focus, labels, keyboard escape) and copy tone.
- Call out finalization immutability and filter serialization when relevant.
