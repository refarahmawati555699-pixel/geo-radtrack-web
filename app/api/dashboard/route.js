import { NextResponse } from "next/server";
import { query, describeError } from "../../../lib/db";
import { camel, camelRows } from "../../../lib/camel";
import { isAdmin } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Satu endpoint yang mengembalikan semua yang dibutuhkan dasbor.
// Seluruh analisis spasial dihitung di PostGIS (lihat db/init/01-schema.sql).
export async function GET(req) {
  try {
    const [feat, ins, rules, zones, line, cfg, ver] = await Promise.all([
      query(
        `SELECT id, segment_id, kp, name, type, lat, lon, target_zone AS zone
         FROM archaeo_features ORDER BY id`
      ),
      query(
        `SELECT id, code, kp, kp_m, lat, lon, nominal_mm, measured_mm, thinning_pct,
                status, zone, site_name, distance_m, conflict, permit, action
         FROM v_inspection_analysis ORDER BY kp_m, id`
      ),
      query(
        `SELECT zone, sort, header, kriteria, sensitivitas, tanah, aturan, protokol, darurat,
                radius_m::float8 AS radius_m
         FROM zone_rules ORDER BY sort`
      ),
      query(
        `SELECT feature_id, feature_name, zone, radius_m,
                ST_AsGeoJSON(geom)::json AS geometry
         FROM v_zone_polygons ORDER BY sort DESC, feature_id`
      ),
      query(
        `SELECT CASE WHEN COUNT(*) >= 2
                     THEN ST_AsGeoJSON(ST_MakeLine(ST_SetSRID(ST_MakePoint(lon, lat), 4326) ORDER BY kp_m, id))::json
                END AS geometry
         FROM v_inspection_analysis`
      ),
      query(`SELECT warn_pct::float8 AS warn_pct, crit_pct::float8 AS crit_pct FROM app_config LIMIT 1`),
      query(`SELECT PostGIS_Version() AS postgis, current_setting('server_version') AS pg`),
    ]);

    const inspections = camelRows(ins.rows).map((r) => ({
      ...r,
      distanceM: r.distanceM == null ? null : Math.round(r.distanceM),
    }));

    const stats = {
      inspections: inspections.length,
      features: feat.rows.length,
      conflicts: inspections.filter((i) => i.conflict).length,
      kritis: inspections.filter((i) => i.status === "Kritis").length,
      waspada: inspections.filter((i) => i.status === "Waspada").length,
      held: inspections.filter((i) => i.permit === "Ditahan").length,
    };

    return NextResponse.json({
      admin: isAdmin(req),
      canLogin: !!process.env.ADMIN_PASSWORD,
      db: {
        postgis: String(ver.rows[0].postgis).split(" ")[0],
        pg: ver.rows[0].pg,
      },
      features: camelRows(feat.rows),
      inspections,
      rules: camelRows(rules.rows),
      zones: camelRows(zones.rows),
      pipeline: line.rows[0] ? line.rows[0].geometry : null,
      config: cfg.rows[0] ? camel(cfg.rows[0]) : { warnPct: 15, critPct: 30 },
      stats,
    });
  } catch (e) {
    return NextResponse.json({ error: describeError(e) }, { status: 500 });
  }
}
