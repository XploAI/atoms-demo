"use client";

import * as React from "react";
import type { Project, Message } from "@/lib/db/schema";
import { useAnthropicKey } from "@/lib/anthropic/byok";
import { useChatStream, type Quota } from "@/lib/chat/use-chat-stream";
import { DEFAULT_MODEL_BYOK, DEFAULT_MODEL_FREE, MODELS, type ModelId } from "@/lib/llm/models";
import { Topbar } from "./topbar";
import { ChatPanel } from "./chat-panel";
import { PreviewPanel } from "./preview-panel";
import { ApiKeyDialog } from "./api-key-dialog";
import { ShareDialog } from "./share-dialog";
import { AgentTimeline } from "./agent-timeline";
import { ModelPicker } from "./model-picker";
import { QuotaBadge } from "./quota-badge";

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

  const { messages, files, draftFiles, streamingPath, pending, send, model, setModel, quota } =
    useChatStream({
      projectId: project.id,
      initialMessages,
      initialFiles: project.files ?? {},
      model: project.model,
      onRateLimited: () => setKeyDialogOpen(true),
    });

  // When the user adds/removes a BYOK key, default the selected model
  // sensibly (Sonnet with a key, DeepSeek without).
  React.useEffect(() => {
    const info = MODELS[model as ModelId];
    if (!info) {
      setModel(key ? DEFAULT_MODEL_BYOK : DEFAULT_MODEL_FREE);
      return;
    }
    if (!info.freeTier && !key) {
      setModel(DEFAULT_MODEL_FREE);
    }
  }, [key, model, setModel]);

  const onModelChange = React.useCallback(
    (m: ModelId) => {
      setModel(m);
      void fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: m }),
      });
    },
    [project.id, setModel]
  );

  // Auto-fire the initial prompt on first arrival, as long as we can use
  // *some* provider — either BYOK or free tier with remaining quota.
  const canGenerate = Boolean(key) || (quota ? quota.remaining > 0 : true);

  React.useEffect(() => {
    if (autoFiredRef.current) return;
    if (!project.prompt) return;
    if (initialMessages.length > 0) return;
    if (!hydrated) return;
    if (!canGenerate) return;
    autoFiredRef.current = true;
    void send(project.prompt);
  }, [hydrated, canGenerate, project.prompt, initialMessages.length, send]);

  // Open the key dialog once, when a free-tier visitor has used up their runs.
  React.useEffect(() => {
    if (!hydrated) return;
    if (key) return;
    if (quota && quota.remaining === 0) setKeyDialogOpen(true);
  }, [hydrated, key, quota]);

  const chatDisabled = !canGenerate && !pending;
  const statusLabel = pending
    ? "generating…"
    : key
      ? project.status
      : quota
        ? quota.remaining > 0
          ? `free tier · ${quota.remaining}/${quota.limit} left`
          : "free tier exhausted"
        : project.status;

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <Topbar
        project={project}
        status={statusLabel}
        onOpenSettings={() => setKeyDialogOpen(true)}
        onShare={() => setShareOpen(true)}
        rightSlot={
          <div className="flex items-center gap-2">
            <AgentTimeline messages={messages} pending={pending} />
            {!key && quota && <QuotaBadge quota={quota} />}
            <ModelPicker
              value={model}
              onChange={onModelChange}
              disabled={pending}
              hasByok={Boolean(key)}
              onLockedClick={() => setKeyDialogOpen(true)}
            />
          </div>
        }
      />

      <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[minmax(320px,420px)_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-zinc-900 bg-zinc-950/40">
          <ChatPanel
            messages={messages}
            pending={pending}
            disabled={chatDisabled}
            onSend={send}
            emptyHint={
              canGenerate ? (
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
                <span>
                  Free tier used up. Add your own Anthropic key from the
                  settings cog ↑ to keep going.
                </span>
              )
            }
          />
        </aside>

        <main className="min-h-0">
          <PreviewPanel
            files={files}
            draftFiles={draftFiles}
            streamingPath={streamingPath}
            pending={pending}
          />
        </main>
      </div>

      <ApiKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        quota={quota ?? undefined}
      />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project.id}
        hasFiles={Object.keys(files).length > 0}
      />
    </div>
  );
}

// re-export for type consumers (e.g. ApiKeyDialog)
export type { Quota };
