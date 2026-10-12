import fs from "node:fs";
import path from "node:path";
import { query } from "../../../lib/db";
import { handle } from "../../../lib/crud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Kembalikan semua data ke isi db/init/02-seed.sql
export const POST = handle(async () => {
  const file = path.join(process.cwd(), "db", "init", "02-seed.sql");
  const sql = fs.readFileSync(file, "utf8");
  await query(sql);
});
