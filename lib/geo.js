// Fungsi bantu kecil untuk tampilan koordinat

// 109.8456 -> "109,8456"
export function fmt(n, d = 4) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "-";
  return Number(n).toFixed(d).replace(".", ",");
}
