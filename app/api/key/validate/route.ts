import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ key: z.string().min(10).max(400) });

/**
 * Probe the user's Anthropic key with a tiny request. Returns { ok: true } if
 * the credential is valid. On error returns the upstream message so the UI
 * can show "rate limited" vs "invalid auth" vs "model not allowed" etc.
 *
 * The key is never logged or persisted.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Missing key" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: parsed.data.key });

  try {
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1,
      messages: [{ role: "user", content: "ping" }],
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const status =
      typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
        ? (e as { status: number }).status
        : 401;
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
