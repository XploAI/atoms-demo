"use client";

import * as React from "react";
import { Check, Copy, Loader2, Share2 } from "lucide-react";
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

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  hasFiles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  hasFiles: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const [url, setUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      setUrl(null);
      setCopied(false);
    }
  }, [open]);

  const create = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      const fullUrl = `${window.location.origin}${data.url}`;
      setUrl(fullUrl);
      setTimeout(() => inputRef.current?.select(), 50);
    } catch (e) {
      toast.error("Couldn't create share link", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setPending(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      inputRef.current?.select();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-purple-300" /> Share this app
          </DialogTitle>
          <DialogDescription>
            Creates a public, read-only snapshot of the current files. Anyone
            with the link can run the app — they don&apos;t need an Anthropic key.
          </DialogDescription>
        </DialogHeader>

        {!hasFiles && (
          <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-400">
            No files yet — let the agent finish building first, then share.
          </div>
        )}

        {url && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Share URL</label>
            <div className="flex gap-2">
              <Input ref={inputRef} value={url} readOnly className="font-mono text-xs" />
              <Button variant="outline" onClick={copy} className="shrink-0 gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!url && (
            <Button variant="accent" onClick={create} disabled={pending || !hasFiles}>
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create share link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
