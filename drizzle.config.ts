import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// Load .env.local first (Vercel pull), then fall back to .env
config({ path: ".env.local" });
config();

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
} satisfies Config;
