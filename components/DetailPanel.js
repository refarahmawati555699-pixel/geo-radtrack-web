import { zoneStyle, statusStyle, permitStyle } from "../data/dashboard";
import { fmt } from "../lib/geo";

function Pill({ style, children }) {
  const st = style || { color: "#8A9BB8", text: "#8A9BB8" };
  return (
    <span className="chip" style={{ background: `${st.color}2E`, color: st.text }}>
      {children}
    </span>
  );
}

const SQL_TEXT = `-- Konflik spasial = penipisan Kritis di dalam Zona Merah
SELECT code, kp, thinning_pct, status, zone, site_name, distance_m
FROM v_inspection_analysis
WHERE conflict;

-- Di dalam view, zona ditentukan oleh:
-- ST_Intersects(titik_inspeksi, ST_Buffer(situs, radius_zona))`;

export default function DetailPanel({ data, sel }) {
  const ins = sel && sel.type === "inspection" ? data.inspections.find((x) => x.id === sel.id) : null;
  const feat = sel && sel.type === "feature" ? data.features.find((x) => x.id === sel.id) : null;
  const rule = (zone) => data.rules.find((r) => r.zone === zone);

  return (
    <aside className="right">
      {ins && (
        <>
          <section className="card">
            <div className="sec-head">
              <h2>Titik Inspeksi</h2>
              <Pill style={statusStyle[ins.status]}>{ins.status}</Pill>
            </div>
            <div className="kv">
              <div><span>Kode</span><span className="mono">{ins.code}</span></div>
              <div><span>Lokasi</span><span className="mono">{ins.kp}</span></div>
              <div><span>Koordinat</span><span className="mono">{fmt(ins.lat)}, {fmt(ins.lon)}</span></div>
              <div><span>Tebal nominal</span><span className="mono">{ins.nominalMm} mm</span></div>
              <div><span>Tebal terukur</span><span className="mono">{ins.measuredMm} mm</span></div>
              <div><span>Penipisan</span><span className="mono">{ins.thinningPct}%</span></div>
            </div>
            <div className="bar" aria-hidden="true">
              <i style={{ width: `${Math.min(100, ins.thinningPct)}%`, background: (statusStyle[ins.status] || statusStyle.Normal).color }} />
            </div>
          </section>

          <section className="card">
            <div className="sec-head">
              <h2>Hasil Analisis Spasial</h2>
              <Pill style={zoneStyle[ins.zone]}>{ins.zone}</Pill>
            </div>
            <div className="kv">
              <div>
                <span>Situs terdekat</span>
                <span style={{ textAlign: "right" }}>{ins.siteName || "Di luar zona sensitivitas"}</span>
              </div>
              <div><span>Jarak ke situs</span><span className="mono">{ins.distanceM !== null ? `${ins.distanceM} m` : "-"}</span></div>
              <div><span>Izin kerja</span><Pill style={permitStyle[ins.permit]}>{ins.permit}</Pill></div>
            </div>
            <div className="label" style={{ margin: "14px 0 4px" }}>REKOMENDASI</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{ins.action}</div>
          </section>
        </>
      )}

      {feat && (
        <>
          <section className="card">
            <div className="sec-head">
              <h2>Fitur Arkeologi</h2>
              <Pill style={zoneStyle[feat.zone]}>{feat.zone}</Pill>
            </div>
            <div className="kv">
              <div><span>Segment_ID</span><span className="mono">{feat.segmentId}</span></div>
              <div><span>Lokasi</span><span className="mono">{feat.kp || "-"}</span></div>
              <div><span>Fitur</span><span style={{ textAlign: "right" }}>{feat.name}</span></div>
              <div><span>Tipe geometri</span><span>{feat.type}</span></div>
              <div><span>Koordinat</span><span className="mono">{fmt(feat.lat)}, {fmt(feat.lon)}</span></div>
              <div><span>Radius buffer</span><span className="mono">{rule(feat.zone) ? `${rule(feat.zone).radiusM} m` : "-"}</span></div>
            </div>
          </section>
          <section className="card">
            <h2>Aturan di {feat.zone}</h2>
            <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5 }}>
              <div className="label" style={{ marginBottom: 4 }}>KRITERIA SPASIAL</div>
              <div style={{ color: "var(--muted)" }}>{rule(feat.zone) ? rule(feat.zone).kriteria : "-"}</div>
              <div className="label" style={{ margin: "12px 0 4px" }}>KARAKTERISTIK TANAH</div>
              <div style={{ color: "var(--muted)" }}>{rule(feat.zone) ? rule(feat.zone).tanah : "-"}</div>
              <div className="label" style={{ margin: "12px 0 4px" }}>METODE PEMELIHARAAN & INSPEKSI</div>
              <div>{rule(feat.zone) ? rule(feat.zone).aturan : "-"}</div>
              <div className="label" style={{ margin: "12px 0 4px" }}>PROTOKOL PEMANTAUAN</div>
              <div>{rule(feat.zone) ? rule(feat.zone).protokol : "-"}</div>
              <div className="label" style={{ margin: "12px 0 4px" }}>PROSEDUR DARURAT</div>
              <div>{rule(feat.zone) ? rule(feat.zone).darurat : "-"}</div>
            </div>
          </section>
        </>
      )}

      {!ins && !feat && (
        <section className="card">
          <h2>Detail</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 0 }}>
            Klik titik di peta atau baris di tabel untuk melihat detail.
          </p>
        </section>
      )}

      <section className="card">
        <h2 style={{ marginBottom: 8 }}>Logika di Database</h2>
        <details className="sql">
          <summary>Lihat query SQL</summary>
          <pre>{SQL_TEXT}</pre>
        </details>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginTop: 10 }}>
          Scanning radiometri → Overlay zonasi situs → Conflict alert → Eksekusi bebas galian → Pembaruan data &amp; pemantauan
        </div>
      </section>
    </aside>
  );
}
