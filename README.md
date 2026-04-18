# Atoms Demo

An open-source homage to [atoms.dev](https://atoms.dev) — describe an app in
plain English, watch a multi-agent team plan it, write it, and run it live in
your browser.

**Live demo:** https://atoms-demo-seven.vercel.app
**Source:** https://github.com/XploAI/atoms-demo

Powered by **Claude** (BYOK), **Next.js 16**, **Sandpack**, and **Neon Postgres**.

---

## What it does

1. Type an idea on the landing page (or pick a template).
2. A tiny agent team — **Planner → Engineer → QA** — streams its work back
   to you live: plan in chat, files in the code tab, app running in the preview tab.
3. Iterate via follow-up messages ("add a reset button", "make the buttons bigger").
4. Save / list / re-open your projects (anonymous, scoped to your browser cookie).
5. Share a generated app via a public read-only link — anyone with the URL can
   run it, no account or API key required.

### Try it in ~60 seconds

1. Open the live demo.
2. On first visit to the workspace, paste an Anthropic API key (the UI
   prompts you — [grab one here](https://console.anthropic.com/settings/keys)).
   It lives only in your browser&apos;s localStorage; the server never stores it.
3. Type something like *"a pomodoro timer with a circular progress ring"* →
   watch the agents build it live in the right pane.
4. Click squares / buttons in the preview — it&apos;s a real React app, not a screenshot.
5. Send a follow-up: *"make the pause button red"*.
6. Hit **Share** to get a public URL anyone can run.

---

## Architecture

### The agent protocol

The system prompt asks Claude to emit an XML-ish stream that is trivially
parseable token-by-token:

```
<agent role="planner">
- bullet 1
</agent>
<agent role="engineer">
One sentence note.
</agent>
<file path="App.tsx">
... complete file ...
</file>
<agent role="qa">
What I verified.
</agent>
<done/>
```

A streaming state-machine parser (`lib/anthropic/protocol.ts`) converts that
into typed events (`agent_start`, `file_delta`, `done`, …). Events flow server
→ client via SSE (`/api/chat`). The client hook (`use-chat-stream.ts`) updates
chat bubbles + the Sandpack file map in real time, so you watch the app come
alive as Claude types it.

XML-ish tags (rather than JSON tool calls) are used because they stream
cleanly without JSON bracketing concerns — same approach used by v0 / bolt /
lovable in production.

### Data model

```
users        ( id uuid pk, created_at )                -- anonymous cookie identity
projects     ( id, user_id, title, prompt, files jsonb, status, model, ts )
messages     ( id, project_id, role, content, files_diff jsonb, ts )
shares       ( id text pk, project_id, files jsonb, title, ts )
```

Projects are scoped to the `aid` cookie (UUID in an `httpOnly` cookie, 1-year
TTL). No login flow. Sharing a project snapshots the current `files` into an
immutable `shares` row keyed by an 8-char `nanoid`.

### BYOK

Each request to `/api/chat` includes `x-anthropic-key: sk-ant-…` as a header.
The server uses it for the one upstream call and drops it — no logging, no
persistence. `/api/key/validate` performs a 1-token probe call so the UI can
distinguish invalid-auth vs rate-limit vs model-access errors.

### Sandbox

`@codesandbox/sandpack-react` runs the generated files in a sandboxed iframe
with React 19 pre-provided. The runner re-renders on every `file_delta` event
with a 250ms debounce, so the preview updates smoothly as files stream in.

---

## Stack

- **Next.js 16** (App Router, RSC + Route Handlers) + **React 19** + **TypeScript**
- **Tailwind CSS 4** with a custom dark theme + **Radix UI** primitives + **Sonner** toasts
- **@anthropic-ai/sdk** for streaming agent calls
- **@codesandbox/sandpack-react** for the live sandbox
- **Drizzle ORM** + **Neon Postgres** (HTTP driver) for persistence
- **Vercel** for hosting

---

## Local dev

```bash
pnpm install
cp .env.example .env.local
# or:  vercel env pull .env.local  (if the Vercel project is already linked)
pnpm tsx scripts/migrate.mjs     # apply drizzle/0000_init.sql to your DB
pnpm dev
```

Open <http://localhost:3000>. You&apos;ll be prompted for your own Anthropic
key the first time you hit a workspace.

### Useful scripts

- `pnpm dev` — Next dev server
- `pnpm build` — production build
- `pnpm db:generate` — regenerate migrations from `lib/db/schema.ts`
- `pnpm tsx scripts/migrate.mjs` — apply migrations (non-interactive; works in CI)
- `pnpm tsx scripts/test-protocol.mjs` — smoke-test the protocol parser at various chunk sizes

---

## Repo layout

```
app/
  (root)/page.tsx              # landing: hero + templates + recent projects
  workspace/[id]/page.tsx      # RSC: loads project + messages, renders shell
  s/[shareId]/page.tsx         # public share viewer
  api/
    projects/[id]/route.ts     # GET/PATCH/DELETE
    projects/route.ts          # GET list, POST create
    chat/route.ts              # POST: SSE stream of agent events
    key/validate/route.ts      # POST: Anthropic key probe
    share/route.ts             # POST: snapshot → public slug

components/
  marketing/                   # landing-page pieces
  workspace/                   # chat, preview, topbar, dialogs, timeline
  ui/                          # shadcn-style Radix primitives

lib/
  anthropic/                   # system prompt + tag parser + BYOK store
  chat/use-chat-stream.ts      # client hook driving chat + preview
  db/                          # schema + lazy Neon HTTP drizzle client
  session/anon.ts              # anon-cookie identity
  templates/seed.ts            # curated template gallery

drizzle/                       # generated SQL migrations
scripts/                       # migrate + parser smoke test
```

See `REPO_STATE.md` for the iteration log.

---

## License

MIT.
