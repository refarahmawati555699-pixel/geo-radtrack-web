"use client";

import { zoneNames, typeOptions, zoneStyle } from "../data/dashboard";
import { Cell } from "./Cell";
import { toCSV, download } from "../lib/download";

const HEAD = ["Segment_ID", "KP_Location", "Feature_Name", "Type", "Latitude (Y)", "Longitude (X)", "Target_Zone"];

// Tabel Sampel Data Spasial: fitur arkeologi
export default function DataTable({ admin, features, rules, sel, query, onSelect, onUpdate, onAdd, onDelete, onReset }) {
  const q = query.trim().toLowerCase();
  const rows = q
    ? features.filter((f) => [f.segmentId, f.kp, f.name, f.type, f.lat, f.lon, f.zone].join(" ").toLowerCase().includes(q))
    : features;
  const radius = (zone) => {
    const r = rules.find((x) => x.zone === zone);
    return r ? r.radiusM : 0;
  };

  const csv = () =>
    download(
      "sampel-data-spasial.csv",
      toCSV(HEAD, features.map((f) => [f.segmentId, f.kp, f.name, f.type, f.lat, f.lon, f.zone])),
      "text/csv;charset=utf-8"
    );
  const json = () =>
    download(
      "sampel-data-spasial.json",
      JSON.stringify(
        features.map((f) => ({
          Segment_ID: f.segmentId,
          KP_Location: f.kp,
          Feature_Name: f.name,
          Type: f.type,
          Latitude: f.lat,
          Longitude: f.lon,
          Target_Zone: f.zone,
        })),
        null,
        2
      ),
      "application/json"
    );

  return (
    <section className="block" aria-labelledby="judul-data">
      <h2 id="judul-data">Sampel Data Spasial (Format JSON / CSV untuk Tim TI)</h2>
      <p className="sub">
        Tabel simulasi koordinat untuk diolah tim TI ke dalam basis data PostGIS/WebGIS.
      </p>

      <div className="toolbar">
        {admin && <button type="button" className="tbtn primary" onClick={onAdd}>+ Tambah baris</button>}
        <button type="button" className="tbtn" onClick={csv}>Unduh CSV</button>
        <button type="button" className="tbtn" onClick={json}>Unduh JSON</button>
        {admin && <button type="button" className="tbtn danger" onClick={onReset}>Reset database ke data awal</button>}
        <span className="count">{q ? `Menampilkan ${rows.length} dari ${features.length} baris` : `${features.length} baris`}</span>
      </div>

      <div className="tablewrap">
        <table className="data">
          <thead>
            <tr>
              {HEAD.map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
              <th scope="col">Radius buffer (m)</th>
              {admin && <th scope="col"><span className="sr-only">Hapus</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr
                key={f.id}
                className={sel && sel.type === "feature" && sel.id === f.id ? "sel" : ""}
                onFocus={() => onSelect({ type: "feature", id: f.id })}
                onClick={() => onSelect({ type: "feature", id: f.id })}
              >
                <td><Cell readOnly={!admin} className="cell mono" value={f.segmentId} aria-label="Segment_ID" onCommit={(v) => onUpdate(f.id, "segmentId", v)} /></td>
                <td><Cell readOnly={!admin} className="cell mono" value={f.kp} aria-label="KP_Location" placeholder="KP 12+400" onCommit={(v) => onUpdate(f.id, "kp", v)} /></td>
                <td><Cell readOnly={!admin} value={f.name} aria-label="Feature_Name" onCommit={(v) => onUpdate(f.id, "name", v)} /></td>
                <td>
                  <select disabled={!admin} className="cell" value={f.type} aria-label="Type" onChange={(e) => onUpdate(f.id, "type", e.target.value)}>
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td><Cell readOnly={!admin} className="cell mono" value={f.lat} inputMode="decimal" aria-label="Latitude (Y)" onCommit={(v) => onUpdate(f.id, "lat", v)} /></td>
                <td><Cell readOnly={!admin} className="cell mono" value={f.lon} inputMode="decimal" aria-label="Longitude (X)" onCommit={(v) => onUpdate(f.id, "lon", v)} /></td>
                <td>
                  <select
                    disabled={!admin}
                    className="cell"
                    value={f.zone}
                    aria-label="Target_Zone"
                    style={{ color: zoneStyle[f.zone] ? zoneStyle[f.zone].text : undefined, fontWeight: 700 }}
                    onChange={(e) => onUpdate(f.id, "zone", e.target.value)}
                  >
                    {zoneNames.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </td>
                <td className="ro mono">{radius(f.zone)}</td>
                {admin && (
                <td>
                  <button type="button" className="icon-btn" aria-label={`Hapus ${f.segmentId}`} onClick={() => onDelete(f.id)}>
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
                <td colSpan={9} style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>Tidak ada baris yang cocok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="hint">
        Koordinat boleh pakai titik atau koma. Target_Zone menentukan radius buffer fitur itu (kolom terakhir, diatur di matriks zonasi).
        Catatan: KP dan koordinat pada sampel ini tidak saling konsisten (selisih KP jauh lebih kecil dari jarak koordinat). Analisis memakai koordinat.
      </p>
    </section>
  );
}
