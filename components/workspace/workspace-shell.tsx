"use client";

import * as React from "react";
import type { Project, Message } from "@/lib/db/schema";
import { Topbar } from "./topbar";
import { ChatPanel, type ChatMessage } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";

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

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <Topbar
        project={project}
        status={project.status}
        onOpenSettings={() => {
          /* iter 5 — BYOK */
        }}
        onShare={() => {
          /* iter 12 — share */
        }}
      />

      <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[minmax(320px,40%)_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-zinc-900 bg-zinc-950/40">
          <ChatPanel
            messages={messages}
            pending={pending}
            disabled
            onSend={() => {
              /* iter 7 — wire to /api/chat */
            }}
            emptyHint={
              <span>
                Streaming chat lands in the next iteration.
                <br />
                For now this is the static shell.
              </span>
            }
          />
        </aside>

        <main className="min-h-0">
          <PreviewPanel files={files} />
        </main>
      </div>
    </div>
  );
}
