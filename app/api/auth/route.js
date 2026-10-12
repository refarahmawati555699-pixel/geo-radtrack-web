import { NextResponse } from "next/server";
import { passwordOk, cookieOptions } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Login admin
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  await new Promise((r) => setTimeout(r, 600)); // memperlambat tebak-tebakan password
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD belum diatur di server." }, { status: 500 });
  }
  if (!passwordOk(body.password)) {
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieOptions());
  return res;
}

// Logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieOptions(true));
  return res;
}
