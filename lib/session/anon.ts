import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { users } from "../db/schema";

const COOKIE = "aid";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Returns this browser's anonymous user id, creating both the row and the
 * cookie on first call. Safe to invoke from RSC and route handlers.
 */
export async function getOrCreateAnonId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  const db = getDb();

  if (existing) {
    const found = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, existing))
      .limit(1);
    if (found.length) return existing;
  }

  const [row] = await db.insert(users).values({}).returning({ id: users.id });
  jar.set(COOKIE, row.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return row.id;
}

/** For tests / `/api/projects/[id]` ownership checks where we only want to read. */
export async function readAnonId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}
