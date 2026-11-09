# Engineering guide

## Project objective

Build an interview-ready task manager using Next.js 15 and TypeScript. The backend
owns the task list, stores it in memory, and exposes task operations through
tRPC. Favor a small, readable implementation that is easy to run, demonstrate,
test, and explain.

## Existing foundation

- Next.js 15.5.29 with the App Router under `src/app`.
- React 19, strict TypeScript, and the `@/*` alias for `src/*`.
- npm with `package-lock.json`; keep dependency changes in that lockfile.
- ESLint and CSS Modules.
- Material UI (`@mui/material`) with Emotion for component styling.
- Zod for shared task input validation and Jest for repository and API tests.
- tRPC v11 for task procedures and the typed HTTP client. TanStack Query
  integration is deferred until the UI uses it.

Keep Next.js on version 15. Build on the existing scaffold without replacing
unrelated files or introducing unnecessary frameworks.

## Task contract

Each task has a server-generated UUID `id`, `title`, `description`, `createdAt`,
and `updatedAt`. Use ISO 8601 strings for timestamps so the transport
does not need custom date serialization.

Validate inputs on the server using shared schemas. Trim titles and reject blank
values. Use explicit, documented limits (initial defaults: 120 characters for a
title and 5,000 for a description). Default an omitted description to an empty
string on create. Allowlist editable fields, reject empty updates, and generate
IDs and timestamps on the server. Task status is deferred.

## Architecture

Use a small layered app structure. Keep route files focused on routing and
server-side data loading, put reusable UI in components, share task schemas and
domain types through `lib`, keep procedures and storage in `server`, and keep
client/server tRPC integration in `trpc`. Add files only when they have a concrete
purpose:

```text
src/
  app/
    api/trpc/[trpc]/route.ts   # tRPC HTTP handler
    layout.tsx                # Root layout and provider composition
    page.tsx                  # SSR task list at /
    tasks/
      new/page.tsx            # Create task
      [id]/edit/page.tsx      # Edit task
  components/                 # Task list, form, and UI components
  lib/
    tasks.ts                  # Shared schemas and domain types
  server/
    api/                      # tRPC setup, root router, and task router
    repositories/             # In-memory task store
  trpc/                       # Client and server tRPC integration and providers
```

- Use Server Components by default. Load the task list and edit data on the
  server. Add client boundaries for interactive forms, event handlers, and query
  hooks where needed.
- Use Material UI for UI components by default. Use its theme, `sx` prop, and
  system styling for component appearance. Retain CSS Modules for page-level
  layout or styles that do not belong to a component.
- Use the `AppRouterCacheProvider` from `@mui/material-nextjs/v15-appRouter` in
  the root layout to collect Emotion styles during App Router rendering.
- Expose `task.list`, `task.getById`, `task.create`, `task.update`, and `task.delete`
  through tRPC. Do not introduce a separate REST API or Server Actions for task
  operations.
- Infer client API types from the tRPC router. Keep runtime server imports out of
  client modules and mark server-only modules accordingly.
- Keep routers focused on validation, error mapping, and repository calls. Keep
  storage independent of React and HTTP handling.
- Use a compatible tRPC client and TanStack Query integration. Refresh relevant
  queries after successful mutations; start with straightforward mutation states
  before adding optimistic updates.

- Keep page components responsible for route composition and server-side data
  loading. Put interactive list and form behavior in focused components under
  `components/`.
- Keep shared task schemas and domain types browser-safe in `lib/`. Put the
  tRPC context, root router, and task procedures in `server/api/`, and keep the
  repository independent of React and HTTP handling in `server/repositories/`.
- Keep the tRPC HTTP handler in `app/api/trpc/[trpc]/route.ts` and client/server
  tRPC setup, query client, and provider integration in `trpc/`. Do not import
  runtime server code into client components.

## In-memory storage rules

- Use a process-scoped store, such as a `Map` keyed by task ID. Never recreate
  the store for each request or place it inside a component.
- Reuse one store across requests in the same Node.js process. A development
  global singleton may preserve it across hot reloads; it is not persistence.
- Return copies so callers cannot mutate stored records outside the repository.
- Generate IDs and timestamps on the server. Preserve `createdAt` on updates and
  refresh `updatedAt` only after a valid update.
- Return a tRPC `NOT_FOUND` error when reading, updating, or deleting an unknown task.
- Define deterministic list ordering, initially newest first with an ID tie-break.
- Use the Node.js runtime for the tRPC route and avoid caching live task results
  across requests in a way that hides mutations.
- Document that tasks disappear on process restart, are shared by users of the
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
npm run test:unit
npx tsc --noEmit
npm run build
npm start
```

`npm start` requires a successful build. Use **Jest for unit tests**, with a fresh
repository instance per test.

Test meaningful behavior: task creation and defaults, input rejection, updates
and timestamp preservation, deletion, unknown IDs, deterministic listing, and
protection against mutation of returned records. Exercise the tRPC boundary as
well as the repository. Manually verify the full create/edit/delete flow, empty
and error states, keyboard access, and a narrow viewport.

For implementation changes, run lint, type checking, relevant tests, and a
production build. Report any checks that could not run and why. Documentation-only
changes do not require an application build.

As part of the application implementation, update `README.md` with setup and run
instructions, available npm scripts, the layered architecture, tRPC CRUD
operations, and the in-memory storage limitation and its tradeoffs. Keep the final
implementation easy for an interviewer to review without additional services or
credentials.
