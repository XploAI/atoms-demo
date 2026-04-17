import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { projects, messages } from "@/lib/db/schema";
import { readAnonId } from "@/lib/session/anon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function ownerScope(id: string) {
  const userId = await readAnonId();
  if (!userId) return null;
  return and(eq(projects.id, id), eq(projects.userId, userId));
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const scope = await ownerScope(id);
  if (!scope) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  const [row] = await db.select().from(projects).where(scope).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, row.id))
    .orderBy(messages.createdAt);

  return NextResponse.json({ project: row, messages: msgs });
}

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  files: z.record(z.string(), z.string()).optional(),
  status: z.enum(["idle", "generating", "ready", "error"]).optional(),
  model: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const scope = await ownerScope(id);
  if (!scope) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = patchSchema.parse(await req.json());
  const db = getDb();
  const [row] = await db
    .update(projects)
    .set({ ...body, updatedAt: new Date() })
    .where(scope)
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project: row });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const scope = await ownerScope(id);
  if (!scope) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  const result = await db.delete(projects).where(scope).returning({ id: projects.id });
  if (!result.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
