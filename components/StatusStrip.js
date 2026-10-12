export default function StatusStrip({ data }) {
  const s = data.stats;
  const items = [
    { label: "Titik inspeksi", value: s.inspections },
    { label: "Fitur arkeologi", value: s.features },
    { label: "Status Kritis", value: s.kritis, color: "#FCA5A5" },
    { label: "Status Waspada", value: s.waspada, color: "#FACC15" },
    { label: "Konflik spasial", value: s.conflicts, color: s.conflicts ? "#FCA5A5" : "#4ADE80" },
    { label: "Izin kerja ditahan", value: s.held },
  ];
  return (
    <footer>
      {items.map((i) => (
        <div className="stat" key={i.label}>
          <small>{i.label}</small>
          <strong style={i.color ? { color: i.color } : undefined}>{i.value}</strong>
        </div>
      ))}
      <div className="stat wide">
        <small>Basis Data Spasial</small>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>
          PostGIS {data.db.postgis} · PostgreSQL {data.db.pg} · data simulasi
        </div>
      </div>
    </footer>
  );
}
