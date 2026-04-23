import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
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
import { streamCompletion, type ChatTurn } from "@/lib/llm/stream";
import { modelInfoOrDefault } from "@/lib/llm/models";
import { bumpUsage, getClientIp, getQuota } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  model: z.string().optional(),
});

/**
 * Streams an agent turn.
 *
 * Provider selection:
 * - If `x-anthropic-key` header present → Anthropic with BYOK, no rate limit.
 * - Else → server DeepSeek key, rate-limited at FREE_TIER_LIMIT per IP.
 *
 * On stream end: persists per-agent rows + merged file map + project status.
 */
export async function POST(req: NextRequest) {
  const byokKey = req.headers.get("x-anthropic-key") || null;

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
  const { projectId, message, model: requestedModel } = parsedBody;

  const modelInfo = modelInfoOrDefault(requestedModel, Boolean(byokKey));

  // Resolve API key + enforce quota for free-tier (DeepSeek) requests.
  let apiKey: string;
  let quotaAfter: { used: number; remaining: number; limit: number } | null = null;
  if (modelInfo.provider === "anthropic") {
    if (!byokKey) {
      return NextResponse.json(
        { error: "anthropic_key_required", message: "Add your Anthropic key to use Claude." },
        { status: 401 }
      );
    }
    apiKey = byokKey;
  } else {
    const serverKey = process.env.DEEPSEEK_API_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: "server_misconfigured", message: "DEEPSEEK_API_KEY is not set on the server." },
        { status: 500 }
      );
    }
    const ip = getClientIp(req);
    const pre = await getQuota(ip);
    if (!pre.allowed) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: `Free tier limit reached (${pre.limit} generations per IP). Add an Anthropic key to keep going.`,
          quota: pre,
        },
        { status: 429 }
      );
    }
    // Consume one allowance up-front. Simplest race-safe approach; if the
    // generation fails mid-stream we don't refund (this is intentional — it
    // also deters repeated-failure attacks).
    quotaAfter = await bumpUsage(ip);
    apiKey = serverKey;
  }

  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const prior = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, project.id))
    .orderBy(messagesTable.createdAt);

  await db.insert(messagesTable).values({
    projectId: project.id,
    role: "user",
    content: message,
  });
  await db
    .update(projects)
    .set({ status: "generating", model: modelInfo.id, updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  const turns = buildHistory(prior, message, project.files);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* controller closed */
        }
      };

      // Up-front, tell the client which provider / quota it's on so the UI
      // can show the remaining count as soon as the request starts.
      send({
        type: "meta",
        provider: modelInfo.provider,
        model: modelInfo.id,
        quota: quotaAfter,
      });

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
        for await (const delta of streamCompletion({
          provider: modelInfo.provider,
          apiKey,
          model: modelInfo.id,
          system: SYSTEM_PROMPT,
          messages: turns,
        })) {
          handleEvents(parser.feed(delta));
        }
        handleEvents(parser.end());

        const mergedFiles = { ...project.files, ...newFiles };

        if (agentTurns.length === 0 && Object.keys(newFiles).length === 0) {
          await db
            .update(projects)
            .set({ status: "error", updatedAt: new Date() })
            .where(eq(projects.id, project.id));
          send({
            type: "error",
            message: "The agent returned no parseable output. Try again or rephrase.",
          });
        } else {
          for (const a of agentTurns) {
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
      "X-Accel-Buffering": "no",
    },
  });
}

function buildHistory(
  prior: Message[],
  newUserMessage: string,
  currentFiles: Record<string, string>
): ChatTurn[] {
  const out: ChatTurn[] = [];
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
  }
  flushAssistant();

  const stateBlock = currentStatePrompt(currentFiles);
  const userContent = stateBlock ? `${stateBlock}\n\n${newUserMessage}` : newUserMessage;
  out.push({ role: "user", content: userContent });

  return out;
}
