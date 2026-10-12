import { isAdmin } from "./auth";
import { NextResponse } from "next/server";
import { describeError } from "./db";
import { typeOptions, zoneNames } from "../data/dashboard";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------- parser/validator ----------
export const str = (label, { required = false } = {}) => (v) => {
  const s = String(v ?? "").trim();
  if (required && !s) throw new HttpError(400, `${label} tidak boleh kosong`);
  return s;
};

export const numIn = (label, min, max) => (v) => {
  if (v === null || v === undefined || String(v).trim() === "") {
    throw new HttpError(400, `${label} wajib diisi`);
  }
  const n = Number(String(v).trim().replace(",", "."));
  if (!Number.isFinite(n)) throw new HttpError(400, `${label} harus berupa angka`);
  if (min !== undefined && n < min) throw new HttpError(400, `${label} minimal ${min}`);
  if (max !== undefined && n > max) throw new HttpError(400, `${label} maksimal ${max}`);
  return n;
};

export const oneOf = (label, list) => (v) => {
  if (!list.includes(v)) throw new HttpError(400, `${label} tidak valid`);
  return v;
};

// ---------- spesifikasi kolom (nama di API -> kolom di database) ----------
export const featureSpec = {
  segmentId: { col: "segment_id", parse: str("Segment_ID", { required: true }) },
  kp: { col: "kp", parse: str("KP_Location") },
  name: { col: "name", parse: str("Feature_Name", { required: true }) },
  type: { col: "type", parse: oneOf("Type", typeOptions) },
  lat: { col: "lat", parse: numIn("Latitude", -90, 90) },
  lon: { col: "lon", parse: numIn("Longitude", -180, 180) },
  zone: { col: "target_zone", parse: oneOf("Target_Zone", zoneNames) },
};

export const inspectionSpec = {
  code: { col: "code", parse: str("Kode", { required: true }) },
  kp: { col: "kp", parse: str("KP_Location") },
  lat: { col: "lat", parse: numIn("Latitude", -90, 90) },
  lon: { col: "lon", parse: numIn("Longitude", -180, 180) },
  nominalMm: { col: "nominal_mm", parse: numIn("Tebal nominal", 0.01, 1000) },
  measuredMm: { col: "measured_mm", parse: numIn("Tebal terukur", 0, 1000) },
};

export const ruleSpec = {
  header: { col: "header", parse: str("Judul zona", { required: true }) },
  kriteria: { col: "kriteria", parse: str("Kriteria") },
  sensitivitas: { col: "sensitivitas", parse: str("Nilai sensitivitas") },
  tanah: { col: "tanah", parse: str("Karakteristik tanah") },
  aturan: { col: "aturan", parse: str("Metode pemeliharaan") },
  protokol: { col: "protokol", parse: str("Protokol pemantauan") },
  darurat: { col: "darurat", parse: str("Prosedur darurat") },
  radiusM: { col: "radius_m", parse: numIn("Radius", 0, 100000) },
};

// ---------- pembuat query (nama tabel dan kolom berasal dari kode, bukan dari input) ----------
export function buildUpdate(table, idCol, id, body, spec) {
  const sets = [];
  const vals = [];
  for (const [key, def] of Object.entries(spec)) {
    if (!(key in body)) continue;
    vals.push(def.parse(body[key]));
    sets.push(`${def.col} = $${vals.length}`);
  }
  if (!sets.length) throw new HttpError(400, "Tidak ada kolom yang diubah");
  vals.push(id);
  return {
    text: `UPDATE ${table} SET ${sets.join(", ")} WHERE ${idCol} = $${vals.length}`,
    values: vals,
  };
}

export function buildInsert(table, body, spec) {
  const cols = [];
  const vals = [];
  for (const [key, def] of Object.entries(spec)) {
    cols.push(def.col);
    vals.push(def.parse(body[key]));
  }
  const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
  return {
    text: `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${ph}) RETURNING id`,
    values: vals,
  };
}

export function parseId(raw) {
  const id = parseInt(raw, 10);
  if (!Number.isInteger(id)) throw new HttpError(400, "ID tidak valid");
  return id;
}

// Bungkus handler route: tangkap error dan ubah jadi respons JSON
export function handle(fn) {
  return async (req, ctx) => {
    try {
      if (!isAdmin(req)) throw new HttpError(401, "Hanya admin yang boleh mengubah data. Login admin dulu.");
      const out = await fn(req, ctx);
      return NextResponse.json(out === undefined ? { ok: true } : out);
    } catch (e) {
      const status = e.status || (e.code === "23514" ? 400 : 500);
      return NextResponse.json({ error: describeError(e) }, { status });
    }
  };
}
