"use client";

import * as React from "react";
import type { Project, Message } from "@/lib/db/schema";
import { useAnthropicKey } from "@/lib/anthropic/byok";
import { useChatStream } from "@/lib/chat/use-chat-stream";
import { Topbar } from "./topbar";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { ApiKeyDialog } from "./api-key-dialog";
import { ShareDialog } from "./share-dialog";
import { AgentTimeline } from "./agent-timeline";
import { ModelPicker } from "./model-picker";

export function WorkspaceShell({
  project,
  messages: initialMessages,
}: {
  project: Project;
  messages: Message[];
}) {
  const [keyDialogOpen, setKeyDialogOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const { key, hydrated } = useAnthropicKey();
  const autoFiredRef = React.useRef(false);

  const { messages, files, pending, send, model, setModel } = useChatStream({
    projectId: project.id,
    initialMessages,
    initialFiles: project.files ?? {},
    model: project.model,
  });

  // Persist model selection
  const onModelChange = React.useCallback(
    (m: string) => {
      setModel(m);
      void fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: m }),
      });
    },
    [project.id, setModel]
  );

  // First arrival: open BYOK dialog if no key.
  React.useEffect(() => {
    if (hydrated && !key) setKeyDialogOpen(true);
  }, [hydrated, key]);

  // Auto-fire the initial prompt if the project was created with one and
  // no agent turn has run yet.
  React.useEffect(() => {
    if (autoFiredRef.current) return;
    if (!project.prompt) return;
    if (initialMessages.length > 0) return;
    if (!key) return;
    autoFiredRef.current = true;
    void send(project.prompt);
  }, [key, project.prompt, initialMessages.length, send]);

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <Topbar
        project={project}
        status={pending ? "generating…" : key ? project.status : "needs API key"}
        onOpenSettings={() => setKeyDialogOpen(true)}
        onShare={() => setShareOpen(true)}
        rightSlot={
          <div className="flex items-center gap-2">
            <AgentTimeline messages={messages} pending={pending} />
            <ModelPicker value={model} onChange={onModelChange} disabled={pending} />
          </div>
        }
      />

      <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[minmax(320px,40%)_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-zinc-900 bg-zinc-950/40">
          <ChatPanel
            messages={messages}
            pending={pending}
            disabled={!key}
            onSend={send}
            emptyHint={
              key ? (
                project.prompt ? (
                  <span>
                    Starting from your prompt:
                    <br />
                    <span className="text-zinc-400">{project.prompt}</span>
                  </span>
                ) : (
                  <span>Type a prompt to start.</span>
                )
              ) : (
                <span>Add your Anthropic API key from the settings cog ↑</span>
              )
            }
          />
        </aside>

        <main className="min-h-0">
          <PreviewPanel files={files} />
        </main>
      </div>

      <ApiKeyDialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen} />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project.id}
        hasFiles={Object.keys(files).length > 0}
      />
    </div>
  );
}
