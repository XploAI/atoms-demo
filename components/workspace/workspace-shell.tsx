"use client";

import * as React from "react";
import type { Project, Message } from "@/lib/db/schema";
import { useAnthropicKey } from "@/lib/anthropic/byok";
import { Topbar } from "./topbar";
import { ChatPanel, type ChatMessage } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { ApiKeyDialog } from "./api-key-dialog";

function toChatMessages(rows: Message[]): ChatMessage[] {
  return rows.map((m) => ({
    id: m.id,
    role: m.role as ChatMessage["role"],
    content: m.content,
  }));
}

export function WorkspaceShell({
  project,
  messages: initialMessages,
}: {
  project: Project;
  messages: Message[];
}) {
  const [messages] = React.useState<ChatMessage[]>(toChatMessages(initialMessages));
  const [files] = React.useState<Record<string, string>>(project.files ?? {});
  const [pending] = React.useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = React.useState(false);
  const { key, hydrated } = useAnthropicKey();

  // Open the BYOK dialog automatically the first time the user arrives without
  // a key in localStorage.
  React.useEffect(() => {
    if (hydrated && !key) setKeyDialogOpen(true);
  }, [hydrated, key]);

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <Topbar
        project={project}
        status={key ? "ready" : "needs API key"}
        onOpenSettings={() => setKeyDialogOpen(true)}
        onShare={() => {
          /* iter 12 — share */
        }}
      />

      <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[minmax(320px,40%)_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-zinc-900 bg-zinc-950/40">
          <ChatPanel
            messages={messages}
            pending={pending}
            disabled={!key}
            onSend={() => {
              /* iter 7 — wire to /api/chat */
            }}
            emptyHint={
              key ? (
                <span>
                  Streaming chat lands in the next iteration.
                  <br />
                  Initial prompt:{" "}
                  <span className="text-zinc-400">{project.prompt ?? "—"}</span>
                </span>
              ) : (
                <span>
                  Add your Anthropic API key to start chatting.
                </span>
              )
            }
          />
        </aside>

        <main className="min-h-0">
          <PreviewPanel files={files} />
        </main>
      </div>

      <ApiKeyDialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen} />
    </div>
  );
}
