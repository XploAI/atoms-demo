import { NextResponse, type NextRequest } from "next/server";
import { getClientIp, getQuota } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Report how many free-tier generations the current IP has left. */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const quota = await getQuota(ip);
  return NextResponse.json({ quota });
}
