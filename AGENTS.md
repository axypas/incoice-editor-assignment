## Mission
Build a minimal, production-minded **invoice editor**: list, filter, create, **finalize**, **delete**. Prioritize correctness, UX states, and tests over visual polish.

## Architectural Guardrails
- **Use the provided OpenAPI client** via `useApi()`; do NOT bypass it with raw fetch/axios.
- **Auth**: `ApiProvider` must include `X-SESSION` token (local dev only). Never commit secrets in tests; e2e will stub network.
- **Data fetching**: colocate calls near features; avoid global state libs. Prefer simple component state.
- **Filtering**: build the `filter` param as a JSON array of `{ field, operator, value }` (operators: `eq`, `gteq`, `in`, etc.). :contentReference[oaicite:7]{index=7}
- **Finalization semantics**: once an invoice is finalized it cannot be edited. Reflect this in UI/logic. :contentReference[oaicite:8]{index=8}

## Code Quality
- **TypeScript** strict; avoid `any`. Narrow types at the edge (API).
- **Naming**: domain-first (Invoice, InvoiceLine, FinalizeInvoiceDialog).
- **Components**: small, focused, accessible by default (labels, roles).
- **Side effects**: isolate in hooks (`useInvoices`, `useFinalizeInvoice`), return `{ run, status, error }`.
- **Error handling**: user-facing messages + logs in dev console; never swallow errors.
- **No needless deps**: use the skeleton’s deps; any new dep must be justified in README.

## Testing Strategy
- **Unit/Integration (Jest + RTL)**  
  - Cover the **happy path** per story + at least one **error** path.  
  - Mock `useApi()` to simulate network; assert **filter** param structure and action calls.
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

## Pull Requests & CI
- **PR template**: problem, solution, screenshots (states), tests added, trade‑offs.
- **Checks**: typecheck, lint, tests. One `yarn ci` script should run all.

## Performance & UX
- Optimistic updates only where safe (finalize/delete can be optimistic with rollback).
- Use `Intl.NumberFormat` for money; display ISO date with a human format.

## Documentation
- **README**: run/test instructions, architecture map, API usage (`useApi`), filters examples.  
- **FUTURE_WORK.md**: 3–5 features with *why / prototype / missing*.
