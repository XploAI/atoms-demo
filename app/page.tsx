import Link from "next/link";
import { HeroPrompt } from "@/components/marketing/hero-prompt";
import { TemplatesGallery } from "@/components/marketing/templates-gallery";
import { RecentProjects } from "@/components/marketing/recent-projects";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden px-6 pb-24 pt-10 sm:pt-16">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />

      {/* Header bar */}
      <header className="mb-16 flex w-full max-w-5xl items-center justify-between sm:mb-24">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-fuchsia-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-900/40">
            A
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            atoms<span className="text-purple-400">·</span>demo
          </span>
        </Link>
        <a
          href="https://github.com/XploAI/atoms-demo"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          <GithubMark className="h-3.5 w-3.5" /> Source
        </a>
      </header>

      {/* Hero */}
      <section className="mb-12 flex w-full flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium tracking-wide text-zinc-400 backdrop-blur">
          Vibe-code your way to a runnable app · powered by Claude
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl md:text-6xl">
          Turn an idea into a{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            runnable app
          </span>
          <br className="hidden sm:block" /> in one prompt.
        </h1>
        <p className="max-w-xl text-balance text-zinc-400">
          Describe what you want. A tiny agent team — planner, engineer, QA — streams
          its work into a live preview you can play with right away.
        </p>
        <div className="mt-4 flex w-full justify-center">
          <HeroPrompt />
        </div>
      </section>

      {/* Templates */}
      <section className="mb-16 flex w-full flex-col items-center gap-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Or start from a template
        </h2>
        <TemplatesGallery />
      </section>

      {/* Recent projects */}
      <RecentProjects />

      <footer className="mt-auto pt-16 text-xs text-zinc-600">
        Inspired by{" "}
        <a
          href="https://atoms.dev"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-400 underline-offset-4 hover:underline"
        >
          atoms.dev
        </a>
        . Built with Next.js · Sandpack · Claude (BYOK).
      </footer>
    </main>
  );
}
