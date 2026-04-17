import Link from "next/link";

export default function ShareNotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-zinc-100">Share not found</h1>
        <p className="text-sm text-zinc-500">
          This share link is invalid or has been removed.
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
