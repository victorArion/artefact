# Engineering guide

## Project objective

Build an interview-ready task manager using Next.js 15 and TypeScript. The backend
owns the ticket list, stores it in memory, and exposes ticket operations through
tRPC. Favor a small, readable implementation that is easy to run, demonstrate,
test, and explain.

## Existing foundation

- Next.js 15.5.29 with the App Router under `src/app`.
- React 19, strict TypeScript, and the `@/*` alias for `src/*`.
- npm with `package-lock.json`; keep dependency changes in that lockfile.
- ESLint and CSS Modules.
- Material UI (`@mui/material`) with Emotion for component styling.
- tRPC, input validation, query integration, and test tooling still need to be
  added when implementing the application.

Keep Next.js on version 15. Build on the existing scaffold without replacing
unrelated files or introducing unnecessary frameworks.


## Ticket contract

Each ticket has a server-generated unique `id`, `title`, `description`, `createdAt`, 
and `updatedAt`. Use ISO 8601 strings for timestamps so the transport
does not need custom date serialization.

Validate inputs on the server using shared schemas. Trim titles and reject blank
values. Use explicit, documented limits (initial defaults: 120 characters for a
title and 5,000 for a description). Allowlist editable fields; clients must not
assign IDs or timestamps. Reject empty updates and unknown status values.

## Architecture

Use the following boundaries as the application grows; create files only when
they have a concrete purpose:

```text
src/
  app/
    api/trpc/[trpc]/route.ts   # tRPC HTTP handler
    layout.tsx                # Root layout and provider composition
    page.tsx                  # Task manager entry point
  components/                 # Ticket list, form, and UI components
  lib/
    tickets.ts                # Shared schemas and domain types
  server/
    api/                      # tRPC setup, root router, and ticket router
    repositories/             # In-memory ticket store
  trpc/                       # Client setup and query provider
```

- Use Server Components by default. Add client boundaries for forms, event
  handlers, and query hooks where needed.
- Use Material UI for UI components by default. Use its theme, `sx` prop, and
  system styling for component appearance. Retain CSS Modules for page-level
  layout or styles that do not belong to a component.
- Use the `AppRouterCacheProvider` from `@mui/material-nextjs/v15-appRouter` in
  the root layout to collect Emotion styles during App Router rendering.
- Expose `ticket.list`, `ticket.create`, `ticket.update`, and `ticket.delete`
  through tRPC. Do not introduce a separate REST API or Server Actions for ticket
  operations.
- Infer client API types from the tRPC router. Keep runtime server imports out of
  client modules and mark server-only modules accordingly.
- Keep routers focused on validation, error mapping, and repository calls. Keep
  storage independent of React and HTTP handling.
- Use a compatible tRPC client and TanStack Query integration. Refresh relevant
  queries after successful mutations; start with straightforward mutation states
  before adding optimistic updates.

## In-memory storage rules

- Use a process-scoped store, such as a `Map` keyed by ticket ID. Never recreate
  the store for each request or place it inside a component.
- Reuse one store across requests in the same Node.js process. A development
  global singleton may preserve it across hot reloads; it is not persistence.
- Return copies so callers cannot mutate stored records outside the repository.
- Generate IDs and timestamps on the server. Preserve `createdAt` on updates and
  refresh `updatedAt` only after a valid update.
- Return a tRPC `NOT_FOUND` error when updating or deleting an unknown ticket.
- Define deterministic list ordering, initially newest first with an ID tie-break.
- Use the Node.js runtime for the tRPC route and avoid caching live ticket results
  across requests in a way that hides mutations.
- Document that tickets disappear on process restart, are shared by users of the
  same process, and are not synchronized across workers or server instances.
  The demo assumes a single running server process.

## UI and implementation standards

- Prefer semantic HTML, labeled controls, visible keyboard focus, and accessible
  error and status messages. Support mobile and desktop layouts.
- Disable submission while a mutation is pending and preserve form input after a
  failed request. Make delete actions explicit to prevent accidental activation.
- Compose existing Material UI components before creating custom controls.
- Keep components and functions focused. Avoid speculative abstractions, unsafe
  type assertions, and `any` where proper inference or validation is available.
- Never expose server stack traces or internal error details in the UI.

## Verification and delivery

Existing commands:

```bash
npm ci
npm run dev
npm run lint
npx tsc --noEmit
npm run build
npm start
```

`npm start` requires a successful build. Use **Jest for unit tests** and
**Cypress for end-to-end tests**. Neither test runner is configured yet; add their
setup and npm scripts during implementation and document the commands before
claiming tests pass. Give each unit test a fresh repository instance to prevent
shared-state leakage, and reset server-side ticket state between end-to-end tests.

Test meaningful behavior: ticket creation and defaults, input rejection, updates
and timestamp preservation, deletion, unknown IDs, deterministic listing, and
protection against mutation of returned records. Exercise the tRPC boundary as
well as the repository. Use Cypress against the running application to verify the
full create/edit/status/delete flow and empty and error states. Manually verify
keyboard access and a narrow viewport.

For implementation changes, run lint, type checking, relevant tests, and a
production build. Report any checks that could not run and why. Documentation-only
changes do not require an application build.

Update `README.md` with setup, scripts, architecture, API operations, the
in-memory limitation, and important tradeoffs. Keep the final implementation easy
for an interviewer to review without additional services or credentials.
