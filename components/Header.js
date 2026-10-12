"use client";

import { useState } from "react";

export default function Header({ query, onQuery, db, error, admin, onLogin, onLogout }) {
  const ok = !!db && !error;
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => {
    setOpen(false);
    setPw("");
    setMsg("");
  };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const err = await onLogin(pw);
    setBusy(false);
    if (err) setMsg(err);
    else close();
  };
  return (
    <header>
      <div className="logo">
        <div className="logo-ico">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B1220" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 17c4-1 5-6 9-6s5-5 9-6" />
            <circle cx="12" cy="11" r="2" />
          </svg>
        </div>
        <div>
          <b>GEO-RADTRACK</b>
          <small>WebGIS Integritas Pipa Hulu Migas</small>
        </div>
      </div>
      <div className="search">
        <label htmlFor="cari" className="sr-only">Cari titik atau situs</label>
        <input
          id="cari"
          type="text"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Cari kode, KP, atau nama situs (memfilter tabel)"
        />
      </div>
      <div className="top-right">
        {admin ? (
          <>
            <a className="editlink" href="#data">Edit data</a>
            {onLogout && <button type="button" className="tbtn" onClick={onLogout}>Keluar admin</button>}
          </>
        ) : (
          onLogin && <button type="button" className="tbtn" onClick={() => setOpen(true)}>Login admin</button>
        )}
        <span className="badge">Simulasi Konflik Spasial</span>
        <span className="conn">
          <span className="dot" style={{ background: ok ? "var(--green)" : "var(--red)" }} />
          {ok ? `Terhubung ke PostGIS ${db.postgis}` : "Database tidak terhubung"}
        </span>
      </div>
      {open && (
        <div className="modal-bg" onClick={close}>
          <form className="modal" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
            <h2>Login admin</h2>
            <p className="sub">Khusus pengelola web. Pengunjung biasa hanya bisa melihat data.</p>
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password admin"
              aria-label="Password admin"
            />
            {msg && <p className="modal-err" role="alert">{msg}</p>}
            <div className="modal-btns">
              <button type="submit" className="tbtn primary" disabled={busy || !pw}>{busy ? "Memeriksa..." : "Masuk"}</button>
              <button type="button" className="tbtn" onClick={close}>Batal</button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
