"use client";

import * as React from "react";
import { CheckCircle2, ExternalLink, KeyRound, Loader2, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnthropicKey, maskKey } from "@/lib/anthropic/byok";

type Status =
  | { kind: "idle" }
  | { kind: "validating" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

export function ApiKeyDialog({
  open,
  onOpenChange,
  onSaved,
  quota,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  /** Current free-tier quota so we can tell the user what they lose/gain. */
  quota?: { used: number; remaining: number; limit: number };
}) {
  const { key: stored, save, clear } = useAnthropicKey();
  const [draft, setDraft] = React.useState("");
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });

  React.useEffect(() => {
    if (open) {
      setDraft("");
      setStatus({ kind: "idle" });
    }
  }, [open]);

  const validateAndSave = async () => {
    const k = draft.trim();
    if (!k) return;
    setStatus({ kind: "validating" });
    try {
      const res = await fetch("/api/key/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        setStatus({ kind: "error", message: msg });
        return;
      }
      save(k);
      setStatus({ kind: "ok" });
      toast.success("API key saved", {
        description: "It lives in localStorage on this device only.",
      });
      onSaved?.();
      setTimeout(() => onOpenChange(false), 600);
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  };

  const onClear = () => {
    clear();
    toast.message("API key cleared");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-purple-300" /> Anthropic API key
          </DialogTitle>
          <DialogDescription>
            Optional — adding your Anthropic key unlocks Claude (Sonnet 4.6 /
            Haiku 4.5 / Opus 4.7) with no IP limit. It lives in your browser&apos;s
            localStorage and is sent per-request; our server never stores it.{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-purple-300 underline-offset-4 hover:underline"
            >
              Get a key <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-100">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Or use the free tier
          </div>
          <div className="mt-0.5 text-emerald-200/80">
            {quota
              ? quota.remaining > 0
                ? `You have ${quota.remaining} of ${quota.limit} free DeepSeek V3 generations left on this IP.`
                : `Free tier used (${quota.used}/${quota.limit}). Add your own key below to keep generating.`
              : "DeepSeek V3 runs on our server key, capped at 3 generations per IP."}
          </div>
        </div>

        {stored && (
          <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs">
            <span className="font-mono text-zinc-400">{maskKey(stored)}</span>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-zinc-500 transition-colors hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">
            {stored ? "Replace key" : "Paste your key"}
          </label>
          <Input
            type="password"
            autoComplete="off"
            placeholder="sk-ant-api03-…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                validateAndSave();
              }
            }}
            className="font-mono"
          />
          {status.kind === "error" && (
            <div className="flex items-start gap-1.5 text-xs text-red-300">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{status.message}</span>
            </div>
          )}
          {status.kind === "ok" && (
            <div className="flex items-center gap-1.5 text-xs text-green-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Key validated.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="accent"
            onClick={validateAndSave}
            disabled={!draft.trim() || status.kind === "validating"}
          >
            {status.kind === "validating" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Validate &amp; save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
