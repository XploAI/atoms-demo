"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "a flashcard study app with spaced repetition",
  "a kanban board with drag-and-drop",
  "a calculator that tracks history",
  "a tip-splitter for restaurant bills",
];

export function HeroPrompt({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  const create = (prompt: string) => {
    if (!prompt.trim()) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { project } = await res.json();
        router.push(`/workspace/${project.id}`);
      } catch (e) {
        toast.error("Couldn't create project", {
          description: e instanceof Error ? e.message : "Unknown error",
        });
      }
    });
  };

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create(value);
        }}
        className={cn(
          "group relative flex flex-col rounded-2xl border bg-zinc-950/80 p-3 shadow-2xl backdrop-blur transition-all",
          "border-zinc-800 focus-within:border-purple-500/60 focus-within:shadow-purple-900/20"
        )}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              create(value);
            }
          }}
          rows={3}
          autoFocus
          placeholder="Describe an app to build…  e.g. a markdown notes app with localStorage save"
          className="w-full resize-none border-0 bg-transparent px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          disabled={pending}
        />
        <div className="flex items-center justify-between gap-2 px-1 pt-2">
          <span className="text-[11px] text-zinc-600">
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono">⌘</kbd>{" "}
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 font-mono">↵</kbd>{" "}
            to submit
          </span>
          <Button
            type="submit"
            variant="accent"
            size="sm"
            disabled={pending || !value.trim()}
            className="rounded-full px-4"
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Build it
                <ArrowUp className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setValue(s)}
            disabled={pending}
            className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-200"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
