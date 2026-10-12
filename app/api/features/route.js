import { query } from "../../../lib/db";
import { handle, buildInsert, featureSpec } from "../../../lib/crud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const body = await req.json();
  const q = buildInsert("archaeo_features", body, featureSpec);
  const r = await query(q.text, q.values);
  return { id: r.rows[0].id };
});
