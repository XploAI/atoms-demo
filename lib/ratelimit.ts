import { eq, sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { ipUsage } from "./db/schema";

/** Free-tier lifetime cap per client IP on the shared DeepSeek key. */
export const FREE_TIER_LIMIT = 3;

export type Quota = {
  used: number;
  remaining: number;
  limit: number;
  allowed: boolean;
};

/** Extract the client IP from Vercel-style forwarded headers. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function getQuota(ip: string): Promise<Quota> {
  const db = getDb();
  const [row] = await db.select().from(ipUsage).where(eq(ipUsage.ip, ip)).limit(1);
  const used = row?.count ?? 0;
  const remaining = Math.max(0, FREE_TIER_LIMIT - used);
  return {
    used,
    remaining,
    limit: FREE_TIER_LIMIT,
    allowed: used < FREE_TIER_LIMIT,
  };
}

/**
 * Atomically increment the IP counter. Returns the post-increment quota.
 * Using ON CONFLICT DO UPDATE keeps this race-free even under parallel
 * requests from the same IP.
 */
export async function bumpUsage(ip: string): Promise<Quota> {
  const db = getDb();
  const [row] = await db
    .insert(ipUsage)
    .values({ ip, count: 1 })
    .onConflictDoUpdate({
      target: ipUsage.ip,
      set: {
        count: sql`${ipUsage.count} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ count: ipUsage.count });
  const used = row?.count ?? 1;
  return {
    used,
    remaining: Math.max(0, FREE_TIER_LIMIT - used),
    limit: FREE_TIER_LIMIT,
    allowed: used <= FREE_TIER_LIMIT,
  };
}
