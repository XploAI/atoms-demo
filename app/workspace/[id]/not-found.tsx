import Link from "next/link";

export default function WorkspaceNotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-zinc-100">Project not found</h1>
        <p className="text-sm text-zinc-500">
          It may have been deleted, or you're on a different browser than the one that
          created it (projects are scoped to your browser cookie).
        </p>
        <Link
          href="/"
          className="inline-block rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-700"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
