"use client";

import * as React from "react";
import { toast } from "sonner";
import { readStoredKey } from "@/lib/anthropic/byok";
import type { StreamEvent, AgentRole } from "@/lib/anthropic/protocol";
import type { ChatMessage } from "@/components/workspace/chat-panel";
import type { Message } from "@/lib/db/schema";

export type Quota = {
  used: number;
  remaining: number;
  limit: number;
};

export type MetaEvent = {
  type: "meta";
  provider: "anthropic" | "deepseek";
  model: string;
  quota: Quota | null;
};

type ServerEvent =
  | StreamEvent
  | MetaEvent
  | { type: "error"; message: string; quota?: Quota }
  | { type: "persisted"; files: Record<string, string> };

function rowsToChat(rows: Message[]): ChatMessage[] {
  return rows.map((m) => ({
    id: m.id,
    role: m.role as ChatMessage["role"],
    content: m.content,
  }));
}

const ROLE_TO_KIND: Record<AgentRole, ChatMessage["role"]> = {
  planner: "planner",
  engineer: "engineer",
  qa: "qa",
};

type SendResult = "ok" | "rate_limited" | "error";

export function useChatStream({
  projectId,
  initialMessages,
  initialFiles,
  model: initialModel,
  onRateLimited,
}: {
  projectId: string;
  initialMessages: Message[];
  initialFiles: Record<string, string>;
  model: string;
  onRateLimited?: (quota: Quota) => void;
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => rowsToChat(initialMessages));
  const [files, setFiles] = React.useState<Record<string, string>>(initialFiles);
  const [draftFiles, setDraftFiles] = React.useState<Record<string, string>>(initialFiles);
  const [streamingPath, setStreamingPath] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [model, setModel] = React.useState(initialModel);
  const [quota, setQuota] = React.useState<Quota | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Prime the quota on mount so the UI can show "N free left" before the user
  // sends anything.
  React.useEffect(() => {
    let alive = true;
    fetch("/api/usage", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.quota) setQuota(data.quota);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const send = React.useCallback(
    async (text: string): Promise<SendResult> => {
      if (pending) return "error";
      setPending(true);

      const userId = `local-user-${Date.now()}`;
      setMessages((prev) => [...prev, { id: userId, role: "user", content: text }]);

      const liveAgentIds: Partial<Record<AgentRole, string>> = {};
      const committedFiles: Record<string, string> = { ...files };
      const liveDraftFiles: Record<string, string> = { ...files };
      let liveFilePath: string | null = null;

      const ac = new AbortController();
      abortRef.current = ac;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const byokKey = readStoredKey();
      if (byokKey) headers["x-anthropic-key"] = byokKey;

      let result: SendResult = "ok";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({ projectId, message: text, model }),
          signal: ac.signal,
        });

        if (!res.ok || !res.body) {
          // Try to surface a structured error body (rate_limited / anthropic_key_required / …)
          const errJson = await res.json().catch(() => null);
          if (res.status === 429 && errJson?.quota) {
            setQuota(errJson.quota);
            onRateLimited?.(errJson.quota);
            toast.error("Free tier exhausted", {
              description:
                errJson?.message ?? "Add your own Anthropic key to keep going.",
            });
            result = "rate_limited";
          } else {
            throw new Error(
              errJson?.message || errJson?.error || (await res.text().catch(() => "")) || `HTTP ${res.status}`
            );
          }
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n\n");
            buf = lines.pop() ?? "";
            for (const block of lines) {
              const line = block.split("\n").find((l) => l.startsWith("data:"));
              if (!line) continue;
              try {
                const ev = JSON.parse(line.slice(5).trim()) as ServerEvent;
                applyEvent(ev);
              } catch {
                /* ignore malformed line */
              }
            }
          }
        }
      } catch (e) {
        if (ac.signal.aborted) {
          toast.message("Cancelled");
        } else {
          toast.error("Stream error", {
            description: e instanceof Error ? e.message : "Unknown error",
          });
          result = "error";
        }
      } finally {
        setPending(false);
        abortRef.current = null;
      }

      return result;

      function applyEvent(ev: ServerEvent) {
        switch (ev.type) {
          case "meta": {
            if (ev.quota) setQuota(ev.quota);
            break;
          }
          case "agent_start": {
            const id = `live-${ev.role}-${Date.now()}`;
            liveAgentIds[ev.role] = id;
            setMessages((prev) => [
              ...prev,
              { id, role: ROLE_TO_KIND[ev.role], content: "", pending: true },
            ]);
            break;
          }
          case "agent_delta": {
            const id = liveAgentIds[ev.role];
            if (!id) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === id ? { ...m, content: m.content + ev.text } : m
              )
            );
            break;
          }
          case "agent_end": {
            const id = liveAgentIds[ev.role];
            if (!id) return;
            setMessages((prev) =>
              prev.map((m) => (m.id === id ? { ...m, pending: false } : m))
            );
            break;
          }
          case "file_start": {
            liveFilePath = ev.path;
            liveDraftFiles[ev.path] = "";
            setDraftFiles({ ...liveDraftFiles });
            setStreamingPath(ev.path);
            break;
          }
          case "file_delta": {
            if (!liveFilePath) return;
            liveDraftFiles[liveFilePath] = (liveDraftFiles[liveFilePath] ?? "") + ev.text;
            setDraftFiles({ ...liveDraftFiles });
            break;
          }
          case "file_end": {
            if (liveFilePath) {
              committedFiles[liveFilePath] = liveDraftFiles[liveFilePath] ?? "";
              setFiles({ ...committedFiles });
            }
            liveFilePath = null;
            setStreamingPath(null);
            break;
          }
          case "persisted": {
            setFiles({ ...ev.files });
            setDraftFiles({ ...ev.files });
            break;
          }
          case "error": {
            toast.error("Agent error", { description: ev.message });
            if (ev.quota) setQuota(ev.quota);
            result = "error";
            break;
          }
          case "done":
          case "text_delta":
            break;
        }
      }
    },
    [projectId, model, pending, files, onRateLimited]
  );

  const cancel = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    files,
    draftFiles,
    streamingPath,
    pending,
    send,
    cancel,
    model,
    setModel,
    quota,
  };
}
