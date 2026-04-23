"use client";

import { Infinity as InfinityIcon, Zap } from "lucide-react";
import type { Quota } from "@/lib/chat/use-chat-stream";
import { cn } from "@/lib/utils";

/** Small pill showing how many free-tier generations are left. */
export function QuotaBadge({ quota }: { quota: Quota }) {
  const empty = quota.remaining === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
        empty
          ? "border-red-500/40 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      )}
      title={
        empty
          ? "Free-tier limit reached for this IP — add your own Anthropic key to keep going."
          : `You have ${quota.remaining} of ${quota.limit} free DeepSeek generations left on this IP.`
      }
    >
      <Zap className="h-3 w-3" />
      {quota.remaining}/{quota.limit} free
    </span>
  );
}

export function UnlimitedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-200">
      <InfinityIcon className="h-3 w-3" />
      BYOK
    </span>
  );
}
