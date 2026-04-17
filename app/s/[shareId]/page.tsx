import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, Share2 } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { shares } from "@/lib/db/schema";
import { SandpackRunner } from "@/components/workspace/sandpack-runner";

export const dynamic = "force-dynamic";

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  const db = getDb();
  const [snapshot] = await db
    .select()
    .from(shares)
    .where(eq(shares.id, shareId))
    .limit(1);
  if (!snapshot) notFound();

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-zinc-900 bg-zinc-950/80 px-4 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Atoms Demo
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-zinc-100">
              {snapshot.title ?? "Shared app"}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              <Share2 className="mr-1 inline h-3 w-3" /> Public snapshot · read-only
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="hidden rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 sm:inline-flex"
        >
          Build your own →
        </Link>
      </header>

      <main className="flex-1 bg-white">
        <SandpackRunner files={snapshot.files} className="h-full" />
      </main>
    </div>
  );
}
