"use client";

import { statusStyle, zoneStyle, permitStyle } from "../data/dashboard";
import { Cell } from "./Cell";
import { toCSV, download } from "../lib/download";

const HEAD = ["Kode", "KP_Location", "Latitude (Y)", "Longitude (X)", "Tebal nominal (mm)", "Tebal terukur (mm)"];
const AUTO = ["Penipisan (%)", "Status", "Zona", "Jarak ke situs (m)", "Izin kerja"];

function Chip({ style, children }) {
  const st = style || { color: "#8A9BB8", text: "#8A9BB8" };
  return (
    <span className="chip" style={{ background: `${st.color}2E`, color: st.text }}>
      {children}
    </span>
  );
}

// Tabel titik inspeksi radiometri / NDT. Kolom "otomatis" dihitung oleh PostGIS.
export default function InspectionTable({ admin, inspections, sel, query, onSelect, onUpdate, onAdd, onDelete }) {
  const q = query.trim().toLowerCase();
  const rows = q
    ? inspections.filter((r) => [r.code, r.kp, r.status, r.zone, r.siteName].join(" ").toLowerCase().includes(q))
    : inspections;

  const csv = () =>
    download(
      "data-inspeksi.csv",
      toCSV(
        [...HEAD, "Penipisan_pct", "Status", "Zona", "Situs_terdekat", "Jarak_m", "Izin_kerja"],
        inspections.map((r) => [r.code, r.kp, r.lat, r.lon, r.nominalMm, r.measuredMm, r.thinningPct, r.status, r.zone, r.siteName, r.distanceM, r.permit])
      ),
      "text/csv;charset=utf-8"
    );

  return (
    <section className="block" aria-labelledby="judul-ins">
      <h2 id="judul-ins">Data Inspeksi Radiometri / NDT</h2>
      <p className="sub">
        Titik ukur ketebalan dinding pipa (data simulasi). Kolom bertanda <b>otomatis</b> dihitung PostGIS: penipisan, status,
        zona yang dilalui, jarak ke situs, dan izin kerja. {admin ? "Ubah ketebalan atau koordinat, lalu lihat statusnya berubah." : ""}
      </p>

      <div className="toolbar">
        {admin && <button type="button" className="tbtn primary" onClick={onAdd}>+ Tambah titik</button>}
        <button type="button" className="tbtn" onClick={csv}>Unduh CSV</button>
        <span className="count">{q ? `Menampilkan ${rows.length} dari ${inspections.length} baris` : `${inspections.length} baris`}</span>
      </div>

      <div className="tablewrap">
        <table className="data">
          <thead>
            <tr>
              {HEAD.map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
              {AUTO.map((h) => (
                <th key={h} scope="col">{h} <span className="auto">otomatis</span></th>
              ))}
              {admin && <th scope="col"><span className="sr-only">Hapus</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={sel && sel.type === "inspection" && sel.id === r.id ? "sel" : ""}
                onFocus={() => onSelect({ type: "inspection", id: r.id })}
                onClick={() => onSelect({ type: "inspection", id: r.id })}
              >
                <td><Cell readOnly={!admin} className="cell mono" value={r.code} aria-label="Kode" onCommit={(v) => onUpdate(r.id, "code", v)} /></td>
                <td><Cell readOnly={!admin} className="cell mono" value={r.kp} aria-label="KP_Location" onCommit={(v) => onUpdate(r.id, "kp", v)} /></td>
                <td><Cell readOnly={!admin} className="cell mono" value={r.lat} inputMode="decimal" aria-label="Latitude" onCommit={(v) => onUpdate(r.id, "lat", v)} /></td>
                <td><Cell readOnly={!admin} className="cell mono" value={r.lon} inputMode="decimal" aria-label="Longitude" onCommit={(v) => onUpdate(r.id, "lon", v)} /></td>
                <td><Cell readOnly={!admin} className="cell mono" value={r.nominalMm} inputMode="decimal" aria-label="Tebal nominal (mm)" onCommit={(v) => onUpdate(r.id, "nominalMm", v)} /></td>
                <td><Cell readOnly={!admin} className="cell mono" value={r.measuredMm} inputMode="decimal" aria-label="Tebal terukur (mm)" onCommit={(v) => onUpdate(r.id, "measuredMm", v)} /></td>
                <td className="ro mono">{r.thinningPct}</td>
                <td className="ro"><Chip style={statusStyle[r.status]}>{r.status}</Chip></td>
                <td className="ro"><Chip style={zoneStyle[r.zone]}>{r.zone}</Chip></td>
                <td className="ro mono">{r.distanceM !== null ? r.distanceM : "-"}</td>
                <td className="ro"><Chip style={permitStyle[r.permit]}>{r.permit}</Chip></td>
                {admin && (
                <td>
                  <button type="button" className="icon-btn" aria-label={`Hapus ${r.code}`} onClick={() => onDelete(r.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                    </svg>
                  </button>
                </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>Tidak ada baris yang cocok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Ambang status (asumsi simulasi): Waspada mulai penipisan 15%, Kritis mulai 30%. Ubah di tabel app_config (lihat README) atau minta kriteria asli dari Anggota Teknik Nuklir.
      </p>
    </section>
  );
}
