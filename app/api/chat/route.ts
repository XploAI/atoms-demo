import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db/client";
import { messages as messagesTable, projects } from "@/lib/db/schema";
import { readAnonId } from "@/lib/session/anon";
import {
  ProtocolParser,
  type StreamEvent,
  type AgentRole,
} from "@/lib/anthropic/protocol";
import { SYSTEM_PROMPT, currentStatePrompt } from "@/lib/anthropic/system-prompt";
import type { Message } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // up to 5 min for slow generations

const bodySchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  model: z.string().optional(),
});

const ALLOWED_MODELS = new Set([
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-7",
]);

/**
 * Streams an agent turn:
 * - Validates ownership via the anon cookie
 * - Persists the user message immediately
 * - Builds Anthropic message history (prior user prompts + summarized assistant
 *   responses + new prompt with current file state)
 * - Pipes Anthropic's stream through ProtocolParser → SSE events to the client
 * - On stream end, persists per-agent rows + merged file map + project status
 *
 * BYOK: the key arrives in the `x-anthropic-key` header, is used once, and
 * never logged or persisted.
 */
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-anthropic-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-anthropic-key header" }, { status: 401 });
  }

  const userId = await readAnonId();
  if (!userId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    parsedBody = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { projectId, message, model } = parsedBody;

  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const chosenModel = model && ALLOWED_MODELS.has(model) ? model : project.model;

  const prior = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, project.id))
    .orderBy(messagesTable.createdAt);

  // Persist user message before streaming so that interrupted streams still
  // record what the user asked.
  await db.insert(messagesTable).values({
    projectId: project.id,
    role: "user",
    content: message,
  });
  await db
    .update(projects)
    .set({ status: "generating", model: chosenModel, updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  const anthropicMessages = buildHistory(prior, message, project.files);

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent | { type: "error"; message: string } | { type: "persisted"; files: Record<string, string> }) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* controller may have been closed */
        }
      };

      const parser = new ProtocolParser();
      const newFiles: Record<string, string> = {};
      let curFile: { path: string; content: string } | null = null;
      let curAgent: { role: AgentRole; content: string } | null = null;
      const agentTurns: Array<{ role: AgentRole; content: string; isEngineer: boolean }> = [];

      const handleEvents = (events: StreamEvent[]) => {
        for (const ev of events) {
          send(ev);
          switch (ev.type) {
            case "agent_start":
              curAgent = { role: ev.role, content: "" };
              break;
            case "agent_delta":
              if (curAgent) curAgent.content += ev.text;
              break;
            case "agent_end":
              if (curAgent) {
                agentTurns.push({
                  role: curAgent.role,
                  content: curAgent.content.trim(),
                  isEngineer: curAgent.role === "engineer",
                });
                curAgent = null;
              }
              break;
            case "file_start":
              curFile = { path: ev.path, content: "" };
              break;
            case "file_delta":
              if (curFile) curFile.content += ev.text;
              break;
            case "file_end":
              if (curFile) {
                newFiles[curFile.path] = curFile.content;
                curFile = null;
              }
              break;
          }
        }
      };

      try {
        const upstream = await client.messages.create({
          model: chosenModel,
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: anthropicMessages,
          stream: true,
        });

        for await (const chunk of upstream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            handleEvents(parser.feed(chunk.delta.text));
          }
        }
        handleEvents(parser.end());

        // Persist agent turns + merged files
        const mergedFiles = { ...project.files, ...newFiles };

        if (agentTurns.length === 0 && Object.keys(newFiles).length === 0) {
          // Model returned nothing parseable
          await db
            .update(projects)
            .set({ status: "error", updatedAt: new Date() })
            .where(eq(projects.id, project.id));
          send({
            type: "error",
            message: "The agent returned no parseable output. Try again or rephrase.",
          });
        } else {
          for (let i = 0; i < agentTurns.length; i++) {
            const a = agentTurns[i];
            await db.insert(messagesTable).values({
              projectId: project.id,
              role: a.role,
              content: a.content,
              filesDiff: a.isEngineer && Object.keys(newFiles).length ? newFiles : undefined,
            });
          }
          await db
            .update(projects)
            .set({ files: mergedFiles, status: "ready", updatedAt: new Date() })
            .where(eq(projects.id, project.id));
          send({ type: "persisted", files: mergedFiles });
        }
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : typeof e === "object" && e !== null && "message" in e
              ? String((e as { message: unknown }).message)
              : "Stream error";
        await db
          .update(projects)
          .set({ status: "error", updatedAt: new Date() })
          .where(eq(projects.id, project.id));
        send({ type: "error", message });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disables nginx buffering, just in case
    },
  });
}

/**
 * Convert prior DB messages + new user prompt + current file state into the
 * alternating user/assistant array Anthropic expects.
 *
 * We collapse each turn's planner/engineer/qa rows into a single assistant
 * message in the same protocol form Claude was trained to emit.
 */
function buildHistory(
  prior: Message[],
  newUserMessage: string,
  currentFiles: Record<string, string>
): Anthropic.MessageParam[] {
  const out: Anthropic.MessageParam[] = [];
  let assistantBuffer: Message[] = [];

  const flushAssistant = () => {
    if (assistantBuffer.length === 0) return;
    const parts = assistantBuffer.map(
      (m) => `<agent role="${m.role}">\n${m.content}\n</agent>`
    );
    out.push({ role: "assistant", content: parts.join("\n") + "\n<done/>" });
    assistantBuffer = [];
  };

  for (const m of prior) {
    if (m.role === "user") {
      flushAssistant();
      out.push({ role: "user", content: m.content });
    } else if (m.role === "planner" || m.role === "engineer" || m.role === "qa") {
      assistantBuffer.push(m);
    }
    // 'system' rows are skipped from history
  }
  flushAssistant();

  const stateBlock = currentStatePrompt(currentFiles);
  const userContent = stateBlock ? `${stateBlock}\n\n${newUserMessage}` : newUserMessage;
  out.push({ role: "user", content: userContent });

  // Anthropic requires the final message to be `user`. Conversation must
  // alternate; if the last assistant turn collapsed weirdly, dedup.
  return out;
}
