# Artefact

Task manager with CRUD, server-rendered initial data, and infinite scroll.
Built with Next.js 15, React 19, TypeScript, tRPC v11, Zod, TanStack Query,
and Material UI. The interface is in Brazilian Portuguese.

## Run

Requires Node.js 22.9+ and npm.

```bash
cp .env_example .env
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The example environment seeds
200 demo tasks. Set `TASK_SEED_COUNT=0` to start empty or change `PORT` as needed.
Restart the server after changing environment variables.

For production, run `npm run build` followed by `npm start`.

For Docker, create `.env` as above, then run:

```bash
docker build -t artefact .
docker run --rm --env-file .env -p 127.0.0.1:3000:3000 artefact
```

If you change `PORT`, update both port numbers in the Docker mapping.

## Architecture

A layered structure separates UI, validation, API procedures, and storage.

```text
src/
  app/                    # Routes, layouts, and tRPC HTTP handler
  components/task/        # Server loaders, list, form, and delete dialog
  lib/                    # Shared schemas, types, and error messages
  server/api/             # tRPC context and task procedures
  server/repositories/    # In-memory storage and demo data
  trpc/                   # Typed HTTP client, query provider, and loading state
```

The UI routes are `/`, `/tasks/new`, and `/tasks/[id]/edit`. The API at
`/api/trpc` exposes `task.listPage`, `task.getById`, `task.create`,
`task.update`, and `task.delete`.

## Key decisions

- **Querying.** Server loaders call tRPC directly for initial list and edit data.
  The list initializes TanStack Query with the first page. Later browser requests
  use the typed HTTP client. Successful mutations invalidate the list cache.
- **Infinite scroll.** Fetch 10 tasks at a time using UUID cursors, ordered newest
  first with an ID tie-break. Deleted cursor positions remain available.
  `IntersectionObserver` triggers loading, with a manual load-more button.
  Loading pauses during requests, errors, and delete confirmation.
- **Cache and feedback.** List data stays fresh for 30 seconds. Loaded pages and
  scroll position survive navigation within the app. Existing cards remain
  visible during requests and errors, with loading indicators and explicit retry
  controls. Invalid cursors trigger recovery from the first page when retried.
- **Validation.** Shared Zod schemas require a title and description, limited to
  120 and 5,000 characters. The server generates UUIDs and ISO timestamps,
  preserves creation time on edits, and returns meaningful errors for missing
  tasks. Forms preserve input after failed submissions.
- **Tradeoffs.** Retaining loaded pages and deleted cursor positions increases
  memory usage over time.

## Verification

```bash
npm run lint
npm run test
npm run build
```

Jest and React Testing Library cover repository behavior, tRPC requests, routes,
forms, deletion, pagination recovery, and navigation state. Manual verification
should also cover browser flows, keyboard access, and mobile layout.
