"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TEMPLATES, type Template, type TemplateTone } from "@/lib/templates/seed";
import { TEMPLATE_ICONS } from "@/components/icons/template-icons";
import { cn } from "@/lib/utils";

/** Tint classes keyed on a template's `tone`. */
const TONE_BG: Record<TemplateTone, string> = {
  purple: "bg-purple-500/10 ring-purple-500/25",
  blue: "bg-blue-500/10 ring-blue-500/25",
  emerald: "bg-emerald-500/10 ring-emerald-500/25",
  amber: "bg-amber-500/10 ring-amber-500/25",
  rose: "bg-rose-500/10 ring-rose-500/25",
  sky: "bg-sky-500/10 ring-sky-500/25",
};

const TONE_FG: Record<TemplateTone, string> = {
  purple: "text-purple-300",
  blue: "text-blue-300",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  rose: "text-rose-300",
  sky: "text-sky-300",
};

export function TemplatesGallery() {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const startFromTemplate = async (t: Template) => {
    setPendingId(t.id);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t.title,
          prompt: t.prompt,
          files: t.starterFiles,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { project } = await res.json();
      router.push(`/workspace/${project.id}`);
    } catch (e) {
      toast.error("Couldn't create project", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
      setPendingId(null);
    }
  };

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATES.map((t) => {
        const pending = pendingId === t.id;
        const Icon = TEMPLATE_ICONS[t.icon];
        return (
          <button
            key={t.id}
            onClick={() => startFromTemplate(t)}
            disabled={pendingId !== null}
            className={cn(
              "group relative flex flex-col items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-left transition-all",
              "hover:-translate-y-0.5 hover:border-zinc-700 hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-purple-950/30",
              pendingId !== null && !pending && "opacity-40",
              pending && "border-purple-500/60"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <div
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-lg ring-1",
                  TONE_BG[t.tone]
                )}
              >
                <Icon className={cn("h-5 w-5", TONE_FG[t.tone])} />
              </div>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                {t.category}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white">
                {t.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t.description}</p>
            </div>
            {pending && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 text-[10px] text-purple-300">
                <Loader2 className="h-3 w-3 animate-spin" /> Spinning up…
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
