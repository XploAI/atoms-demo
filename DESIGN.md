# Design notes — Atoms Demo

A short companion to the README. Three sections:
1. **Approach & tradeoffs** — why this shape
2. **Status** — what's done vs what's not
3. **Roadmap** — what I'd build next, and why (in priority order)

---

## 1 · Approach & tradeoffs

The brief — build something Atoms-like — is broad. Narrowing it took a few
deliberate calls:

### Protocol: XML-ish tags, not JSON tool calls

Claude emits a tagged stream:

```
<agent role="planner">…</agent>
<agent role="engineer">…</agent>
<file path="App.tsx">…</file>
<agent role="qa">…</agent>
<done/>
```

Token-by-token streaming is the whole UX. JSON tool calls serialise badly
mid-flight (you can't render a half-open `{ "arguments": { "file":` yet),
so we'd be stuck showing a spinner until each tool completed. Tags render
cleanly character-by-character, which is why v0 / bolt / lovable all use a
similar approach in production. Cost: Claude has to follow our format
strictly; if it doesn't, our parser silently drops the malformed region.
We mitigate with a forgiving parser (tail-safety buffer across chunk
boundaries, unknown text outside tags surfaced as `text_delta` rather than
an exception) and a system prompt that's explicit about the contract.

### Preview: commit on `file_end`, not on every delta

First deploy streamed partial file content straight into Sandpack. You got
pretty streaming *code* in the Code tab, but the preview iframe tried to
recompile on every character, producing a parade of "Unterminated string
literal" errors until the file was done. Fix: two file maps — `draftFiles`
(in-flight, feeds the Code tab) and `files` (committed, feeds Sandpack).
Only `file_end` / `persisted` events commit. Feels magical now; preview is
stable and the Code tab still gives the "watching it type" payoff.

### Auth: anonymous cookie, not email / OAuth

`aid` cookie (UUID, httpOnly, 1-year TTL) on first visit. Projects scoped
to it. Zero friction — visitors can type their idea and be in a workspace
in <5 seconds. Cost: no cross-device access; you can't "log in from
another laptop." That's acceptable for a demo, and a real product would
layer a `users.handle` / OAuth link on top of this same row later.

### BYOK, not a shared server key

Every visitor brings their own Anthropic key, stored in `localStorage`
only, sent as `x-anthropic-key` on every chat request. The server uses it
once and drops it (never logged, never persisted). Tradeoffs:

- **Pro:** the host pays nothing for inference — a viral hit doesn't
  bankrupt the account. Also, privacy-wise, the server doesn't see any
  single central key.
- **Con:** onboarding gains one step (the key dialog). For a portfolio
  demo this is fine; for a real product we'd do a free-tier with a host
  key + rate limit, then BYOK for power users.

### Persistence: Neon HTTP + Drizzle, not an ORM pool

Neon's HTTP driver (not their Postgres over WebSockets) gives us a
request-per-query model that matches serverless function lifecycles — no
connection pool to tune, no cold-start pool reaper. Drizzle stays
lightweight. Four tables (users, projects, messages, shares) cover the
whole schema. Shares are immutable snapshots keyed on an 8-char nanoid,
so a shared link never "breaks" if the owner keeps editing.

### Sandbox: Sandpack, not a self-hosted iframe runner

Sandpack is a mature CodeSandbox-built React sandbox with a safe iframe,
hot reload, error overlays, and React 19 support out of the box. Writing
our own sandbox would have been a week of work for worse results. The
constraint this places on the *generated* apps is "React-only, no external
deps, no fetch" — codified in the system prompt. That's limiting but it
matches the shape of things people actually ask to vibe-code (timers,
games, calculators, notes apps).

### Agent loop: linear, not self-healing

Claude plays Planner → Engineer → QA in a single message. QA's "verified
X, Y, Z" text is narrative, not an actual feedback loop back into the
model. The demo relies on Claude usually getting it right on the first
pass. A real autonomous loop (compile → catch errors → re-ask) is the
obvious next upgrade and is deliberately out of scope here.

### Stack: Next.js 16 + Drizzle + Neon + Vercel

One-click deploys, zero infra. The alternative (Cloudflare Workers +
D1 / Turso) would have been nice for edge latency but complicates
streaming SSE. Next.js App Router handles it natively.

---

## 2 · Status

### Done

| Area | What ships |
|---|---|
| Core flow | Landing → prompt → workspace → multi-agent stream → live preview → iterate |
| Agent loop | Planner / Engineer / QA roles via XML-ish protocol; robust streaming parser (tested at chunk sizes 1–9999) |
| Persistence | Neon Postgres: `users`, `projects`, `messages`, `shares`. Refresh restores chat + file state via RSC. |
| Identity | Anonymous `aid` cookie, 1-year TTL |
| BYOK | `/api/key/validate` probe-call + `ApiKeyDialog` + `localStorage` store |
| Preview | Sandpack with commit-on-file-end, full-pane height, "writing App.tsx" indicator |
| Code tab | Live file-list sidebar; auto-jumps to whichever file is currently streaming |
| Extensions | Templates gallery (6 curated + SVG tile icons), public share links (`/s/[id]`), multi-agent timeline pill, model picker (Sonnet 4.6 / Haiku 4.5 / Opus 4.7) |
| Ops | Vercel production deploy; Neon via Marketplace; non-interactive migrations (`scripts/migrate.mjs`); parser smoke test (`scripts/test-protocol.mjs`, 6/6 pass) |

### Not done

Intentionally skipped or deferred:

- **Stop-generation button.** `AbortController` is wired in the hook but
  there's no UI to trigger it. Low effort, not demo-critical.
- **Error-feedback loop.** Sandpack error overlay shows, but errors
  aren't auto-fed back to the agent.
- **Mobile layout.** The grid collapses to one column but chat ends up on
  top which pushes preview below the fold. Needs a drawer pattern.
- **Inline project title editing.** Title is set at create-time and not
  editable from the workspace.
- **Rate limiting on `/api/chat`.** Currently anyone can hammer it; in
  practice BYOK means it's their cost, but still.
- **Template starter files.** All templates go through first-turn
  generation. Could ship 2–3 with pre-built files to make "try it now"
  instant.
- **Code-tab editing.** Read-only for now. No way to hand-edit agent
  output.
- **GitHub export.** Atoms has it; we don't.
- **Race mode.** Atoms' headline feature — run a prompt across multiple
  models in parallel and compare. Not built.
- **Real auth / account claim.** Anonymous only.
- **Framer Motion animations.** Bundled but unused. Could smooth a few
  transitions, but zero and the demo is plenty alive as is.

---

## 3 · Roadmap (if I kept working on this)

Ordered by *impact per hour of work*.

### S-tier — unlocks the "wow"

1. **Error-feedback loop.** The single biggest UX jump from here. When
   Sandpack reports a compile or runtime error, auto-inject a `system`
   message back into the chat ("the last app crashed with: `X is not
   defined`") and re-invoke the agent. Combined with a small "Fix it"
   button on the Sandpack error overlay, this turns the demo from
   "usually works" into "self-healing." ~½ day. Highest priority.

2. **External npm deps via import maps / esm.sh.** The React-only
   restriction bites for almost anything chart-y, markdown-y, or
   animation-y. Allow the agent to declare deps in a special tag
   (`<deps>recharts, framer-motion</deps>`) and rewrite them through
   esm.sh at preview time. Dramatically widens the "vibe-codable"
   surface area. ~1 day.

3. **Race mode.** Atoms' signature feature. Given a prompt, fan out to
   Sonnet + Haiku + Opus in parallel, render three side-by-side Sandpack
   previews, let the user pick a winner (that winner becomes the canonical
   project state). The agent loop is already stateless per request, so
   this is mostly UI plumbing + a small `/api/chat` change to take a list
   of models. ~1 day.

### A-tier — polish that strangers will notice

4. **Stop-generation button** (~½ hour). Low effort, obvious.
5. **Rate limiting** per IP on `/api/chat` and `/api/key/validate` (~2 h).
   Necessary before I'd be comfortable sharing the URL widely.
6. **Mobile layout** — tabs-at-top with a drawer for chat and the preview
   as the canvas (~½ day). Right now the demo is effectively desktop-only.
7. **Inline-editable titles + rename from the projects list** (~1 h).
8. **Shipped starter files** on the Pomodoro, Notes, and Snake templates
   so clicking them takes you straight to a working app (the agent turn
   becomes optional) (~2 h).

### B-tier — nice but not load-bearing

9. **Hand-editable Code tab.** CodeMirror swap; on change, PATCH the
   files back to the DB and re-render Sandpack. Gives users an out when
   the agent gets 95% there and just needs a tweak. ~1 day.
10. **GitHub export.** Wire GitHub OAuth → create-repo → push files.
    Useful as a "take it home" story for actual users, less important for
    a portfolio demo. ~1 day.
11. **Rich chat primitives.** Let the agent render a tool-call card
    ("installed recharts", "ran npm build — 0 errors") when it invokes
    deps / verification. More "agentic" feel. ~½ day.

### C-tier — real-product territory

12. **Account claim.** Anonymous → GitHub OAuth link preserving the
    existing `userId`. Cross-device access.
13. **Billing & host key for non-BYOK users.** Would need metering,
    pricing, and abuse controls — half a product.
14. **Backend generation.** Let the agent emit `/api/*` route handlers
    alongside the React app. Requires a safe per-project isolate —
    probably a Cloudflare Worker per project, with a secrets vault.
    Days to weeks.
15. **Analytics dashboard** showing prompt → output pairs, most-forked
    templates, error rates per model. Useful for shipping improvements,
    not for the demo itself.

### Why this order

The top three items extend the core magic (agent produces a *working*
app, on the *first* try, in *any* technology). Items 4–8 harden the demo
for strangers. Items 9–11 are nice secondary features that pad the
story without being critical. Items 12+ are where the demo stops being
a demo and starts being a product — they'd require a real scope
conversation before I'd touch them.

The single smallest change with the biggest impact is **#1 — the
error-feedback loop.** If I had only four more hours, that's what I'd
spend them on.
