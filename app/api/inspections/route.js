import { query } from "../../../lib/db";
import { handle, buildInsert, inspectionSpec } from "../../../lib/crud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const body = await req.json();
  const q = buildInsert("inspections", body, inspectionSpec);
  const r = await query(q.text, q.values);
  return { id: r.rows[0].id };
});
