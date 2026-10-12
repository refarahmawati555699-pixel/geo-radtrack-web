import { query } from "../../../../lib/db";
import { handle, buildUpdate, ruleSpec, HttpError } from "../../../../lib/crud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const PATCH = handle(async (req, ctx) => {
  const { zone } = await ctx.params;
  const body = await req.json();
  const q = buildUpdate("zone_rules", "zone", decodeURIComponent(zone), body, ruleSpec);
  const r = await query(q.text, q.values);
  if (!r.rowCount) throw new HttpError(404, "Zona tidak ditemukan");
});
