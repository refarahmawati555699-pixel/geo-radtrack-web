import { zoneStyle, statusStyle } from "../data/dashboard";

const layerList = [
  { id: "pipa", label: "Jalur pipa", sub: "Dibentuk PostGIS dari titik inspeksi", color: "#38BDF8" },
  { id: "zona", label: "Zona sensitivitas", sub: "Buffer situs sesuai radius zona", color: "#EF4444" },
  { id: "ins", label: "Titik inspeksi radiometri", sub: "Berwarna menurut status penipisan", color: "#F59E0B" },
  { id: "feat", label: "Fitur arkeologi", sub: "Situs dan lokasi sensitif", color: "#A78BFA" },
  { id: "label", label: "Label kode", sub: "Tampilkan kode di peta", color: "#8A9BB8" },
];

export default function LayerPanel({ layers, onToggle, rules, config }) {
  const statusInfo = [
    ["Normal", `penipisan < ${config.warnPct}%`],
    ["Waspada", `${config.warnPct}% sampai < ${config.critPct}%`],
    ["Kritis", `≥ ${config.critPct}%`],
  ];

  return (
    <aside className="left">
      <div>
        <div className="label">LAYER PETA</div>
        <div className="layers">
          {layerList.map((l) => (
            <button
              key={l.id}
              type="button"
              className="layer"
              aria-pressed={layers[l.id]}
              onClick={() => onToggle(l.id)}
              style={{ "--c": l.color }}
            >
              <span className="box">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0B1220" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </span>
              <span className="t">
                <b>{l.label}</b>
                <small>{l.sub}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="label">LEGENDA ZONASI</div>
        <div className="legend">
          {rules.map((r) => (
            <div key={r.zone}>
              <i style={{ background: zoneStyle[r.zone] ? zoneStyle[r.zone].color : "#8A9BB8" }} />
              <span>
                <b>{r.zone}</b>
                <br />
                <small>{r.sensitivitas}{r.radiusM > 0 ? ` · buffer ${r.radiusM} m` : ""}</small>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="label">STATUS DINDING PIPA</div>
        {statusInfo.map(([name, desc]) => (
          <div className="diam" key={name}>
            <i style={{ background: statusStyle[name].color, borderRadius: "50%", transform: "none" }} />
            <span><b>{name}</b> <span style={{ color: "var(--muted)" }}>{desc}</span></span>
          </div>
        ))}
      </div>
    </aside>
  );
}
