# REPO_STATE

This file is the source of truth for the iteration loop.

The Ralph Loop reads this on every pass to know what to do next.

## How to use this file (for the loop)

1. Read `## Current iteration` and `## Next iteration` below.
2. Implement **only** the next iteration. Keep the diff small enough to review.
3. Run `pnpm build` locally to confirm no type/build errors.
4. If everything works, move "Next iteration" → "Completed iterations", pick the
   following item from `## Backlog`, write it as the new "Next iteration".
5. Commit with message: `feat(iter-N): <short summary>` and push.
6. If the deploy URL is set in `## Deploy`, run `vercel --prod` to redeploy.

## Project goal

A working "Atoms-style" demo at a public URL: chat → multi-agent generates a
runnable web app → live preview → save / share / iterate. See
`/Users/zihan/.claude/plans/serene-snacking-karp.md` (host filesystem) for the
full plan, or read this file plus the README.

---

## Completed iterations

- [x] **Iter 1** — Bootstrap Next.js 15 + Tailwind 4 + TS, install all runtime deps (Anthropic SDK, Sandpack, Drizzle, Neon, Radix primitives), define dark theme tokens, placeholder landing page, push to GitHub.

## Current iteration

_(none in progress)_

## Next iteration

- [ ] **Iter 2** — DB layer + identity + projects API.
  - Add `lib/db/schema.ts` (users, projects, messages, shares — see plan for shape).
  - Add `lib/db/client.ts` using `drizzle-orm/neon-http` + `@neondatabase/serverless`.
  - Add `drizzle.config.ts`.
  - Add `lib/session/anon.ts` — `getOrCreateAnonId()` reads/sets `aid` httpOnly cookie, upserts `users` row.
  - Add `app/api/projects/route.ts` (GET list for current user, POST create).
  - Add `app/api/projects/[id]/route.ts` (GET, PATCH, DELETE).
  - Add `.env.example` documenting `DATABASE_URL`.
  - Generate first migration: `pnpm drizzle-kit generate` (commit the SQL).
  - Done when: `curl -X POST http://localhost:3000/api/projects -d '{"title":"Test"}'` returns a row, and a follow-up `GET` lists it.

## Backlog

- [ ] **Iter 3** — Landing page proper: hero with prompt textarea, templates grid (static for now), CTA POSTs to `/api/projects` then redirects to `/workspace/[id]`.
- [ ] **Iter 4** — Workspace shell: 2-pane resizable layout, chat panel skeleton, preview panel with empty Sandpack.
- [ ] **Iter 5** — BYOK: `<ApiKeyDialog>`, `/api/key/validate` (1-token probe), localStorage wiring, settings cog to clear/rotate.
- [ ] **Iter 6** — `/api/chat` SSE endpoint that streams Anthropic responses; `lib/anthropic/system-prompt.ts`; `lib/anthropic/protocol.ts` parser emitting typed events.
- [ ] **Iter 7** — Wire chat UI to streaming endpoint; render planner / engineer / qa bubbles in real time.
- [ ] **Iter 8** — Sandpack reflects file events live; on every `file_end`, merge into files state and re-render preview.
- [ ] **Iter 9** — Persist messages + project files per turn; refresh restores everything.
- [ ] **Iter 10** — Edit flow: subsequent prompts include current files in context; agent emits replacements.
- [ ] **Iter 11** — Templates gallery wired (6 templates with starter files); selecting one bypasses the first generation.
- [ ] **Iter 12** — Share dialog + `/api/share` snapshot + `/s/[shareId]` public viewer.
- [ ] **Iter 13** — Multi-agent timeline component (left rail with role icons + step text, updates live).
- [ ] **Iter 14** — Model picker (Sonnet 4.6 / Haiku 4.5 / Opus 4.7) persisted per project.
- [ ] **Iter 15** — Polish: empty states, loading shimmers, error toasts, mobile responsive, README screenshots.
- [ ] **Iter 16** — Final deploy + 10-step smoke test on the live URL.

## Deploy

- Production URL: https://atoms-demo-seven.vercel.app
- GitHub: https://github.com/XploAI/atoms-demo
- Vercel project: `hblues-projects/atoms-demo`

## Notes / blockers

_(none yet)_
