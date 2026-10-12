import pg from "pg";

const { Pool } = pg;

// Nilai bawaan cocok dengan docker-compose.yml
const url = process.env.DATABASE_URL || "postgres://geo:geo123@127.0.0.1:5433/georadtrack";

// Simpan pool di globalThis supaya tidak dibuat berulang saat hot reload
const g = globalThis;
export const pool = g.__geoPool || (g.__geoPool = new Pool({ connectionString: url, max: 5 }));

export function query(text, params) {
  return pool.query(text, params);
}

// Ubah error teknis jadi pesan yang bisa ditindaklanjuti
export function describeError(e) {
  const code = e && (e.code || (e.errors && e.errors[0] && e.errors[0].code));
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT") {
    return "Database tidak terhubung. Pastikan Docker Desktop berjalan, lalu jalankan: docker compose up -d";
  }
  if (code === "28P01") return "Login database ditolak. Cek DATABASE_URL (user dan password).";
  if (code === "3D000") return "Database georadtrack belum ada. Jalankan: npm run db:reset";
  if (code === "42P01" || code === "42704") {
    return "Tabel atau view belum ada. Jalankan: npm run db:reset (menghapus data lalu membuat ulang skema).";
  }
  if (code === "23514") return "Nilai di luar batas yang diizinkan (cek lat/lon dan ketebalan).";
  return (e && e.message) || String(e);
}
