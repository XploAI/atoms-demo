import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db/client";
import { projects, shares } from "@/lib/db/schema";
import { readAnonId } from "@/lib/session/anon";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ projectId: z.string().uuid() });

/** Snapshot the project's current files into a public, immutable share row. */
export async function POST(req: NextRequest) {
  const userId = await readAnonId();
  if (!userId) return NextResponse.json({ error: "No session" }, { status: 401 });

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, body.projectId), eq(projects.userId, userId)))
    .limit(1);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (Object.keys(project.files ?? {}).length === 0) {
    return NextResponse.json(
      { error: "Nothing to share yet — wait for the agent to write some files." },
      { status: 400 }
    );
  }

  const id = nanoid(8);
  await db.insert(shares).values({
    id,
    projectId: project.id,
    files: project.files,
    title: project.title,
  });

  return NextResponse.json({ id, url: `/s/${id}` }, { status: 201 });
}
