import { query } from "../../../../lib/db";
import { handle, buildUpdate, inspectionSpec, parseId, HttpError } from "../../../../lib/crud";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const PATCH = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const q = buildUpdate("inspections", "id", parseId(id), body, inspectionSpec);
  const r = await query(q.text, q.values);
  if (!r.rowCount) throw new HttpError(404, "Baris tidak ditemukan");
});

export const DELETE = handle(async (req, ctx) => {
  const { id } = await ctx.params;
  await query("DELETE FROM inspections WHERE id = $1", [parseId(id)]);
});
