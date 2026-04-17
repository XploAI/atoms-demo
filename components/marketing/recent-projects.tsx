"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/lib/db/schema";

export function RecentProjects() {
  const [projects, setProjects] = React.useState<Project[] | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) return setProjects([]);
      const data = await res.json();
      setProjects(data.projects ?? []);
    } catch {
      setProjects([]);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setProjects((p) => p?.filter((x) => x.id !== id) ?? null);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete project");
      load();
    }
  };

  if (projects === null) return null;
  if (projects.length === 0) return null;

  return (
    <section className="w-full max-w-5xl">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Your projects
      </h2>
      <ul className="divide-y divide-zinc-900 rounded-xl border border-zinc-800 bg-zinc-950/40">
        {projects.map((p) => (
          <li key={p.id} className="group flex items-center gap-3 px-4 py-3">
            <Link
              href={`/workspace/${p.id}`}
              className="flex flex-1 items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-100">{p.title}</div>
                <div className="truncate text-xs text-zinc-500">
                  {new Date(p.updatedAt).toLocaleString()} ·{" "}
                  <span className="capitalize">{p.status}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-200" />
            </Link>
            <button
              type="button"
              aria-label="Delete project"
              onClick={() => remove(p.id)}
              className="rounded p-1.5 text-zinc-600 opacity-0 transition-opacity hover:bg-zinc-900 hover:text-red-400 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
