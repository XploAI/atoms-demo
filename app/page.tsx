export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-medium tracking-wide text-zinc-400 backdrop-blur">
          Atoms Demo · v0
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
          Turn ideas into{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            runnable apps
          </span>
        </h1>
        <p className="max-w-xl text-zinc-400">
          A small homage to <span className="text-zinc-200">atoms.dev</span>. Chat with
          an AI team, watch your app build itself, and run it live in the browser.
        </p>
        <p className="text-xs text-zinc-600">Bootstrapping… UI lands in the next iteration.</p>
      </div>
    </main>
  );
}
