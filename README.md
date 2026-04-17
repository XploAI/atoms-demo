# Atoms Demo

An open-source homage to [atoms.dev](https://atoms.dev) — describe an app in
plain English, watch a multi-agent team plan it, write it, and run it live in
your browser.

Powered by **Claude** (BYOK), **Next.js 16**, **Sandpack**, and **Neon Postgres**.

> Built as a portfolio demo. See `REPO_STATE.md` for the iteration log.

## What it does

1. Type an idea on the landing page (or pick a template).
2. A small agent team — **Planner → Engineer → QA** — streams its work back to
   you live: plan in chat, files in the code tab, app running in the preview tab.
3. Iterate via follow-up messages ("add a reset button", "make the buttons bigger").
4. Save / list / re-open your projects (anonymous, scoped to your browser).
5. Share a generated app via a public read-only link.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + custom dark theme + Radix UI primitives
- **@anthropic-ai/sdk** for streaming agent calls
- **@codesandbox/sandpack-react** for the live in-browser sandbox
- **Drizzle ORM** + **Neon Postgres** for persistence
- **Vercel** for hosting

## BYOK

This demo never holds an Anthropic key on the server. On first use you paste
your own key into a settings dialog; it lives in `localStorage` and is sent
per-request as a header. The server uses it for the one call and drops it.

## Local dev

```bash
pnpm install
cp .env.example .env.local
# fill in DATABASE_URL (Neon free tier works fine)
pnpm drizzle-kit push
pnpm dev
```

Open <http://localhost:3000>.

## Project layout

See `REPO_STATE.md` for the canonical iteration plan and current status.

## License

MIT.
