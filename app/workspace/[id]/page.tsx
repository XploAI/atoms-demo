import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { messages as messagesTable, projects } from "@/lib/db/schema";
import { readAnonId } from "@/lib/session/anon";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await readAnonId();
  if (!userId) notFound();

  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  if (!project) notFound();

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, project.id))
    .orderBy(messagesTable.createdAt);

  return <WorkspaceShell project={project} messages={msgs} />;
}
