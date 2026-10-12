import crypto from "node:crypto";

export const COOKIE = "gr_admin";
const MAX_AGE = 60 * 60 * 12; // 12 jam

// Token = HMAC dari ADMIN_PASSWORD. Tanpa password yang benar, token tidak bisa dibuat.
function token() {
  return crypto.createHmac("sha256", process.env.ADMIN_PASSWORD || "").update("geo-radtrack-admin-v1").digest("hex");
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function passwordOk(pw) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const h = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
  return safeEqual(h(pw), h(real));
}

function readCookie(req) {
  const raw = req.headers.get("cookie") || "";
  const m = raw.split(";").map((s) => s.trim()).find((s) => s.startsWith(COOKIE + "="));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : "";
}

// Admin = membawa cookie yang valid. Kalau ADMIN_PASSWORD belum diisi:
// boleh mengedit hanya saat development (npm run dev), ditolak di production.
export function isAdmin(req) {
  if (!process.env.ADMIN_PASSWORD) return process.env.NODE_ENV !== "production";
  return safeEqual(readCookie(req), token());
}

export function cookieOptions(clear = false) {
  return {
    name: COOKIE,
    value: clear ? "" : token(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: clear ? 0 : MAX_AGE,
  };
}
