/**
 * Applies the reviews migration when SUPABASE_DB_URL is set in .env.local
 *
 * Get the URL from Supabase Dashboard:
 *   Project Settings → Database → Connection string → URI
 *   (use the password you set when creating the project)
 *
 * Add to .env.local:
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...
 *
 * Then run: npm run db:reviews
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = { ...process.env, ...loadEnvLocal() };
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;

if (!dbUrl) {
  console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  Reviews tables are missing in Supabase                          ║
╠══════════════════════════════════════════════════════════════════╣
║  Option A — SQL Editor (recommended, one-time):                  ║
║    1. Open: https://supabase.com/dashboard/project/              ║
║              kyswfxsqpmxjltuxzjtz/sql/new                        ║
║    2. Copy all of: supabase/RUN_THIS_FOR_REVIEWS.sql             ║
║    3. Paste → Run                                                ║
║    4. Refresh your product page                                  ║
║                                                                  ║
║  Option B — CLI (if you have the database password):             ║
║    Add SUPABASE_DB_URL to .env.local, then run again.            ║
╚══════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

const sqlPath = resolve(root, "supabase", "RUN_THIS_FOR_REVIEWS.sql");
const sql = readFileSync(sqlPath, "utf8");

const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("Connected. Applying reviews migration...");
  await client.query(sql);
  const { rows } = await client.query(
    "SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_reviews'"
  );
  if (rows[0]?.n === 1) {
    console.log("✓ product_reviews table created successfully.");
    console.log("  Refresh your product page — the console error should be gone.");
  } else {
    console.error("Migration ran but table was not found. Check Supabase logs.");
    process.exit(1);
  }
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
