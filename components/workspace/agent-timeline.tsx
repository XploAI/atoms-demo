"use client";

import * as React from "react";
import { Hammer, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./chat-panel";

type AgentRole = "planner" | "engineer" | "qa";

const STAGES: Array<{ role: AgentRole; label: string; icon: LucideIcon; tone: string }> = [
  { role: "planner", label: "Plan", icon: Search, tone: "text-blue-300" },
  { role: "engineer", label: "Build", icon: Hammer, tone: "text-purple-300" },
  { role: "qa", label: "Verify", icon: ShieldCheck, tone: "text-green-300" },
];

/** Tiny timeline showing which agent is currently active or has run. */
export function AgentTimeline({
  messages,
  pending,
}: {
  messages: ChatMessage[];
  pending: boolean;
}) {
  const lastUserIdx = lastIndex(messages, (m) => m.role === "user");
  const turn = lastUserIdx >= 0 ? messages.slice(lastUserIdx + 1) : messages;

  const status = (role: AgentRole): "done" | "active" | "pending" => {
    const present = turn.find((m) => m.role === role);
    if (!present) return "pending";
    if (present.pending) return "active";
    return "done";
  };

  // If everything is "pending" but the chat isn't pending, hide the timeline —
  // we haven't started yet.
  const anyActivity = turn.length > 0;
  if (!anyActivity && !pending) return null;

  return (
    <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[11px]">
      {STAGES.map((s, i) => {
        const st = status(s.role);
        const Icon = s.icon;
        const isLast = i === STAGES.length - 1;
        return (
          <React.Fragment key={s.role}>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors",
                st === "done" && cn("bg-zinc-800", s.tone),
                st === "active" && cn("animate-pulse bg-zinc-800", s.tone),
                st === "pending" && "text-zinc-600"
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{s.label}</span>
            </div>
            {!isLast && <span className="text-zinc-700">›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function lastIndex<T>(arr: T[], pred: (x: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
  return -1;
}
