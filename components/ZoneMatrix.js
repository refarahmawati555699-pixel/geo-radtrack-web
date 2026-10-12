"use client";

import { Cell, CellArea } from "./Cell";

const HEAD_COLORS = { "Zona Merah": "#EF4444", "Zona Kuning": "#EAB308", "Zona Hijau": "#22C55E" };

const ROWS = [
  { label: "Nilai Sensitivitas (S)", key: "sensitivitas" },
  { label: "Kriteria Spasial (RFM)", key: "kriteria" },
  { label: "Karakteristik Tanah", key: "tanah" },
  { label: "Metode Pemeliharaan & Inspeksi Pipa", key: "aturan" },
  { label: "Protokol Pemantauan", key: "protokol" },
  { label: "Prosedur Darurat", key: "darurat" },
  { label: "Radius buffer dari situs (m)", key: "radiusM", numeric: true },
];

// Matriks zonasi tersimpan di tabel zone_rules (PostGIS)
export default function ZoneMatrix({ admin, rules, onUpdate }) {
  return (
    <section className="block" aria-labelledby="judul-matriks">
      <h2 id="judul-matriks">2. Matriks Zonasi Sensitivitas Arkeologi &amp; Parameter Fisik</h2>
      <p className="sub">
        Matriks Zonasi Spasial. <b>Radius buffer</b> dipakai PostGIS untuk membentuk zona di sekeliling situs, sehingga menentukan hasil konflik di peta.
      </p>

      <div className="tablewrap">
        <table className="data matrix">
          <thead>
            <tr>
              <th scope="col">Parameter</th>
              {rules.map((r) => (
                <th key={r.zone} scope="col" style={{ borderTop: `3px solid ${HEAD_COLORS[r.zone] || "#8A9BB8"}` }}>
                  <Cell readOnly={!admin} value={r.header} aria-label={`Judul ${r.zone}`} onCommit={(v) => onUpdate(r.zone, "header", v)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key}>
                <th scope="row"><span style={{ padding: 8, display: "block", fontWeight: 700, color: "var(--text)" }}>{row.label}</span></th>
                {rules.map((r) => (
                  <td key={r.zone}>
                    {row.numeric ? (
                      <Cell readOnly={!admin} className="cell mono" value={r[row.key]} inputMode="decimal" aria-label={`${row.label}, ${r.zone}`} onCommit={(v) => onUpdate(r.zone, row.key, v)} />
                    ) : (
                      <CellArea readOnly={!admin} rows={4} value={r[row.key]} aria-label={`${row.label}, ${r.zone}`} onCommit={(v) => onUpdate(r.zone, row.key, v)} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
