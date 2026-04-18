#!/usr/bin/env node
/** Apply drizzle migrations to the Neon DB using the HTTP driver (non-interactive). */
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const dir = "drizzle";

const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
console.log(`Applying ${files.length} migration file(s)…`);

for (const f of files) {
  const path = join(dir, f);
  const raw = await readFile(path, "utf8");
  // drizzle separates statements with `--> statement-breakpoint`
  const stmts = raw
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  console.log(`  ${f}: ${stmts.length} statement(s)`);
  for (const s of stmts) {
    try {
      await sql.query(s);
    } catch (e) {
      const msg = String(e?.message ?? e);
      // Idempotency: ignore "already exists" and FK-already-exists errors.
      if (msg.includes("already exists") || msg.includes("duplicate")) {
        console.log(`    (skipped: already exists)`);
        continue;
      }
      console.error(`  FAILED at statement:\n${s.slice(0, 200)}…\n`, msg);
      process.exit(1);
    }
  }
}
console.log("✓ Migrations applied");
