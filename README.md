# Artefact

Artefact is a Next.js 15 project for a simple task manager.

## Project structure

The application uses a layered structure built on the Next.js App Router.

```text
src/
  app/
    api/trpc/[trpc]/route.ts  # tRPC HTTP endpoint
    page.tsx                  # Server-rendered task list
    tasks/
      new/page.tsx            # Create task
      [id]/edit/page.tsx       # Edit task
    layout.tsx                # Root layout and providers
  components/                 # Task list, forms, and reusable UI
  lib/
    tasks.ts                  # Shared task schemas and types
  server/
    api/                      # tRPC setup and task procedures
    repositories/             # In-memory task storage
  trpc/                       # tRPC client, server helpers, and query setup
```

Route pages compose the screens and load their initial data on the server.
Interactive forms and list actions live in components. Shared validation and
types live in `lib`, while tRPC procedures and the repository live in `server`.
The `trpc` directory contains the typed HTTP client for the task API.

## Configure the port

On a fresh checkout, create your local environment file from the example.

```bash
cp .env_example .env
```

Set `PORT` in `.env` to change the listening port. The default is `3000`. Restart
the server or container after editing the file, then open `http://localhost:<port>`
using the new value. For local npm and VS Code launches, a `PORT` already exported
in your shell takes precedence over `.env`.

## Run with Docker

With Docker running, build and start the production image from the project root.

```bash
docker build -t artefact .
docker run --rm --env-file .env -p 127.0.0.1:3000:3000 artefact
```

Open [http://localhost:3000](http://localhost:3000). Press `Ctrl+C` to stop the
container. Docker passes `PORT` from `.env` to the container at startup. If you
set `PORT=4000`, use `-p 127.0.0.1:4000:4000` and open
[http://localhost:4000](http://localhost:4000). Changing the port only requires
starting a new container from the existing image.

The image build needs network access to download npm dependencies. The task
manager is designed to store tasks in memory, so restarting the container
clears its task data.

## Run locally for development

With Node.js 22.9 or later and npm installed, run the following commands.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or use the port set in `.env`.
The production start command (`npm start` after `npm run build`) also reads `.env`.

## Run tests

```bash
npm run test:unit
```

The Jest suites cover the in-memory repository and the tRPC HTTP boundary.

## Run from VS Code

Open the project folder in VS Code and install dependencies from the integrated
terminal if needed:

```bash
npm ci
```

Open **Run and Debug** (`Ctrl+Shift+D` on Windows/Linux or `Shift+Command+D` on
macOS), select **Next.js**, and press **F5**. This starts the
development server with the debugger attached. Then open
[http://localhost:3000](http://localhost:3000) or use the port set in `.env`.
