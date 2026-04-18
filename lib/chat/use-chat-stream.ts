"use client";

import * as React from "react";
import { toast } from "sonner";
import { readStoredKey } from "@/lib/anthropic/byok";
import type { StreamEvent, AgentRole } from "@/lib/anthropic/protocol";
import type { ChatMessage } from "@/components/workspace/chat-panel";
import type { Message } from "@/lib/db/schema";

type ServerEvent =
  | StreamEvent
  | { type: "error"; message: string }
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

export function useChatStream({
  projectId,
  initialMessages,
  initialFiles,
  model: initialModel,
}: {
  projectId: string;
  initialMessages: Message[];
  initialFiles: Record<string, string>;
  model: string;
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => rowsToChat(initialMessages));
  // Two file maps:
  //   files       — committed snapshot fed to Sandpack. Only updated on
  //                 file_end or the final `persisted` event, so the preview
  //                 never tries to compile half-written code.
  //   draftFiles  — includes in-flight content for the Code tab so users
  //                 still get the satisfying "watching it type" effect.
  const [files, setFiles] = React.useState<Record<string, string>>(initialFiles);
  const [draftFiles, setDraftFiles] = React.useState<Record<string, string>>(initialFiles);
  const [streamingPath, setStreamingPath] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [model, setModel] = React.useState(initialModel);
  const abortRef = React.useRef<AbortController | null>(null);

  const send = React.useCallback(
    async (text: string) => {
      const key = readStoredKey();
      if (!key) {
        toast.error("No API key set");
        return;
      }
      if (pending) return;

      setPending(true);

      // Add the user message optimistically
      const userId = `local-user-${Date.now()}`;
      setMessages((prev) => [...prev, { id: userId, role: "user", content: text }]);

      // We'll mutate these per-event:
      const liveAgentIds: Partial<Record<AgentRole, string>> = {};
      const committedFiles: Record<string, string> = { ...files }; // → Sandpack preview
      const liveDraftFiles: Record<string, string> = { ...files }; // → Code tab
      let liveFilePath: string | null = null;

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-anthropic-key": key,
          },
          body: JSON.stringify({ projectId, message: text, model }),
          signal: ac.signal,
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || `HTTP ${res.status}`);
        }

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
      } catch (e) {
        if (ac.signal.aborted) {
          toast.message("Cancelled");
        } else {
          toast.error("Stream error", {
            description: e instanceof Error ? e.message : "Unknown error",
          });
        }
      } finally {
        setPending(false);
        abortRef.current = null;
      }

      function applyEvent(ev: ServerEvent) {
        switch (ev.type) {
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
            // Commit the just-completed file to the preview now that we know
            // it's syntactically whole. Sandpack re-renders once, cleanly.
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
            break;
          }
          case "done":
          case "text_delta":
            // ignore
            break;
        }
      }
    },
    [projectId, model, pending, files]
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
  };
}
