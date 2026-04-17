import { NextResponse, type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { getOrCreateAnonId } from "@/lib/session/anon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getOrCreateAnonId();
  const db = getDb();
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
  return NextResponse.json({ projects: rows });
}

const createSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  prompt: z.string().max(4000).optional(),
  files: z.record(z.string(), z.string()).optional(),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getOrCreateAnonId();
  const body = await req
    .json()
    .catch(() => ({}))
    .then((b) => createSchema.parse(b));

  const title =
    body.title?.trim() ||
    deriveTitle(body.prompt) ||
    "Untitled project";

  const db = getDb();
  const [row] = await db
    .insert(projects)
    .values({
      userId,
      title,
      prompt: body.prompt,
      files: body.files ?? {},
      model: body.model ?? "claude-sonnet-4-6",
    })
    .returning();

  return NextResponse.json({ project: row }, { status: 201 });
}

function deriveTitle(prompt: string | undefined): string | undefined {
  if (!prompt) return undefined;
  const first = prompt.split(/[.\n!?]/)[0]?.trim();
  if (!first) return undefined;
  return first.length > 60 ? first.slice(0, 57) + "…" : first;
}
