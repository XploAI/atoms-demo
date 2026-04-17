"use client";

import * as React from "react";
import { ArrowUp, Hammer, Loader2, Search, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "planner" | "engineer" | "qa" | "system";
  content: string;
  pending?: boolean;
};

const ROLE_META: Record<
  ChatMessage["role"],
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  user: { label: "You", icon: User, tone: "bg-zinc-800 text-zinc-100" },
  planner: { label: "Planner", icon: Search, tone: "bg-blue-500/15 text-blue-200" },
  engineer: { label: "Engineer", icon: Hammer, tone: "bg-purple-500/15 text-purple-200" },
  qa: { label: "QA", icon: ShieldCheck, tone: "bg-green-500/15 text-green-200" },
  system: { label: "System", icon: ShieldCheck, tone: "bg-zinc-700/50 text-zinc-300" },
};

export function ChatPanel({
  messages,
  pending,
  onSend,
  disabled,
  emptyHint,
}: {
  messages: ChatMessage[];
  pending: boolean;
  onSend: (text: string) => void;
  disabled?: boolean;
  emptyHint?: React.ReactNode;
}) {
  const [draft, setDraft] = React.useState("");
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    if (!draft.trim() || pending || disabled) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="flex-1">
        <div ref={scrollerRef} className="flex flex-col gap-3 p-4">
          {messages.length === 0 && (
            <div className="grid place-items-center pt-16 text-center text-xs text-zinc-600">
              {emptyHint ?? "No messages yet."}
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {pending && (
            <div className="flex items-center gap-2 px-1 py-2 text-xs text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" /> Agents thinking…
            </div>
          )}
        </div>
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-zinc-900 bg-zinc-950/60 p-3"
      >
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/60 focus-within:border-purple-500/60">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              disabled
                ? "Set your Anthropic API key in settings to chat…"
                : "Tell the agents what to change… (⌘+↵ to send)"
            }
            rows={2}
            disabled={pending || disabled}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <div className="flex items-center justify-end px-2 pb-2">
            <Button
              type="submit"
              size="sm"
              variant="accent"
              disabled={pending || disabled || !draft.trim()}
              className="h-7 w-7 rounded-full p-0"
              aria-label="Send"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const meta = ROLE_META[message.role];
  const Icon = meta.icon;
  return (
    <div className="flex gap-2.5">
      <div
        className={cn(
          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
          meta.tone
        )}
      >
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {meta.label}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {message.content}
          {message.pending && <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-zinc-500" />}
        </div>
      </div>
    </div>
  );
}
