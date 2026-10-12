// Konstanta tampilan. Data sebenarnya ada di database (db/init/02-seed.sql).

// Urutan sama dengan kolom matriks zonasi
export const zoneNames = ["Zona Merah", "Zona Kuning", "Zona Hijau"];

export const typeOptions = ["Point", "Polygon", "Polygon/Point", "LineString"];

export const zoneStyle = {
  "Zona Merah": { key: "merah", color: "#EF4444", text: "#FCA5A5" },
  "Zona Kuning": { key: "kuning", color: "#EAB308", text: "#FACC15" },
  "Zona Hijau": { key: "hijau", color: "#22C55E", text: "#4ADE80" },
};

export const statusStyle = {
  Normal: { color: "#22C55E", text: "#4ADE80" },
  Waspada: { color: "#EAB308", text: "#FACC15" },
  Kritis: { color: "#EF4444", text: "#FCA5A5" },
};

export const permitStyle = {
  Ditahan: { color: "#EF4444", text: "#FCA5A5" },
  Bersyarat: { color: "#EAB308", text: "#FACC15" },
  "Terbit otomatis": { color: "#22C55E", text: "#4ADE80" },
};
