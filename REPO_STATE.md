# REPO_STATE

Source of truth for the iteration loop. Update this file at the end of every iteration.

## Project goal

A working Atoms-style demo at a public URL: chat → multi-agent generates a
runnable web app → live preview → save / share / iterate. See the
`README.md` for what the demo does at a user level.

---

## Completed iterations

- [x] **Iter 1** — Bootstrap Next.js 16 + Tailwind 4 + TS, install runtime deps (Anthropic SDK, Sandpack, Drizzle, Neon, Radix primitives), define dark theme tokens, placeholder landing, push to GitHub, first Vercel deploy.
- [x] **Iter 2** — DB schema (users / projects / messages / shares), Drizzle + Neon HTTP client (lazy singleton), anon-cookie identity helper, `/api/projects` CRUD routes.
- [x] **Iter 3** — Landing page: hero prompt textarea (⌘+↵ submits), templates gallery (6 curated ideas), recent projects list.
- [x] **Iter 4** — Workspace shell: 2-pane layout, topbar with home/title/status/settings/share, chat panel skeleton with role-coloured bubbles, preview panel with Sandpack + Code tabs, friendly empty states.
- [x] **Iter 5** — BYOK: `/api/key/validate` probes the user's key with a 1-token Haiku call; `useAnthropicKey()` hook + localStorage; `ApiKeyDialog` auto-opens on first arrival at workspace.
- [x] **Iter 6–8** — Streaming agent loop: `lib/anthropic/system-prompt.ts` (protocol-enforcing system prompt), `lib/anthropic/protocol.ts` (robust streaming tag parser — tested at chunk sizes 1/3/7/13/64/9999), `/api/chat` route (SSE bridge from Anthropic stream → client events), `use-chat-stream()` client hook driving chat bubbles + Sandpack file map in real time.
- [x] **Iter 9–10** — Persistence: user messages saved pre-stream, per-agent rows (planner/engineer/qa) saved post-stream, merged files + status on `projects`. Refresh restores state via RSC. Edit flow: `buildHistory()` replays prior turns in protocol form + current file state in the final user message, so follow-ups like "make the buttons bigger" work.
- [x] **Iter 11–12** — Share links: `/api/share` snapshots `projects.files` into an immutable `shares` row with nanoid(8) id; `/s/[shareId]` renders Sandpack read-only (no login, no API key needed for viewers). `ShareDialog` with copy-to-clipboard.
- [x] **Iter 13–14** — Agent timeline pill in topbar (plan › build › verify, lights up during streaming); ModelPicker (Sonnet 4.6 / Haiku 4.5 / Opus 4.7) persisted per-project.
- [x] **Iter 15 partial** — Parser smoke test; workspace `loading.tsx` shimmer; polish pass.
- [x] **Iter 16** — Deployed to Vercel, Neon DB provisioned, migrations applied; smoke tested POST/GET/workspace on the live URL.

## Current iteration

_(none — demo is live)_

## Next / nice-to-haves

- [ ] Starter files on some templates so selecting them skips the first agent turn entirely
- [ ] Stop-generation button wired to `AbortController`
- [ ] "Fix error" button in Sandpack error overlay that auto-sends the error back to the agent
- [ ] Mobile: preview-on-top / chat-on-bottom layout
- [ ] Inline-editable project title
- [ ] Rate-limit /api/chat per-IP to protect the instance

## Deploy

- Production URL: **https://atoms-demo-seven.vercel.app**
- GitHub: https://github.com/XploAI/atoms-demo
- Vercel project: `hblues-projects/atoms-demo`
- Neon DB: connected via Vercel Marketplace (auto-injects `DATABASE_URL`)

## How the loop works

1. Read `## Completed iterations` and `## Next / nice-to-haves`.
2. Pick the top item from nice-to-haves, implement it end-to-end.
3. Run `pnpm build` locally.
4. If green: move item to Completed, `git commit -m "feat(iter-N): …"`, `git push`, `vercel deploy --prod --scope=hblues-projects`.
5. Update the Deploy URL block if the domain changed.
