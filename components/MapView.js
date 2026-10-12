"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { statusStyle, zoneStyle } from "../data/dashboard";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Ikon fitur arkeologi menurut tipe geometri (tanpa file gambar)
function featureIcon(L, type, color, selected) {
  const t = String(type || "").toLowerCase();
  const hex = `<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="${color}" stroke="#0B1220" stroke-width="1.5"/>`;
  let shape;
  if (t.includes("linestring")) {
    shape = `<path d="M3 17L9 9L15 17L21 9" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (t.includes("/")) {
    shape = `${hex}<circle cx="12" cy="12" r="3.2" fill="#0B1220"/>`;
  } else if (t.includes("polygon")) {
    shape = hex;
  } else {
    shape = `<circle cx="12" cy="12" r="8" fill="${color}" stroke="#0B1220" stroke-width="1.5"/>`;
  }
  const ring = selected
    ? `<circle cx="12" cy="12" r="11" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 2"/>`
    : "";
  return L.divIcon({
    className: "feat-icon",
    html: `<svg width="28" height="28" viewBox="0 0 24 24">${ring}${shape}</svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function MapView({ data, layers, sel, onSelect }) {
  const el = useRef(null);
  const mapRef = useRef(null);
  const Lref = useRef(null);
  const groups = useRef(null);
  const fitted = useRef(false);
  const [ready, setReady] = useState(false);
  const [hiddenAlert, setHiddenAlert] = useState(null);
  const boxRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  // Buat peta sekali (Leaflet hanya dimuat di browser)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("leaflet");
      const L = mod.default || mod;
      if (cancelled || !el.current) return;
      Lref.current = L;
      const map = L.map(el.current).setView([-6.85, 109.5], 8);
      const dark = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        className: "tiles-dark",
      });
      const street = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        crossOrigin: true,
      });
      const sat = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri", maxZoom: 19, crossOrigin: true }
      );
      dark.addTo(map);
      L.control.layers({ "Peta gelap": dark, "Peta jalan": street, "Citra satelit": sat }, null, { position: "topleft" }).addTo(map);
      groups.current = { zona: L.layerGroup(), pipa: L.layerGroup(), ins: L.layerGroup(), feat: L.layerGroup() };
      mapRef.current = map;
      fitted.current = false;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      groups.current = null;
      setReady(false);
    };
  }, []);

  // Gambar ulang semua layer setiap data, layer, atau pilihan berubah
  useEffect(() => {
    const L = Lref.current;
    const map = mapRef.current;
    const g = groups.current;
    if (!ready || !L || !map || !g || !data) return;

    Object.values(g).forEach((lg) => lg.clearLayers());

    // Zona sensitivitas (buffer dari PostGIS)
    data.zones.forEach((z) => {
      const st = zoneStyle[z.zone];
      if (!st) return;
      L.geoJSON(z.geometry, {
        style: {
          color: st.color,
          weight: 2,
          fillColor: st.color,
          fillOpacity: st.key === "merah" ? 0.28 : 0.14,
          dashArray: st.key === "kuning" ? "6 4" : null,
        },
        interactive: false,
      }).addTo(g.zona);
    });

    // Jalur pipa: garis dasar dari PostGIS, lalu ruas berwarna menurut status terburuk
    if (data.pipeline) {
      L.geoJSON(data.pipeline, { style: { color: "#0B1220", weight: 9, opacity: 0.9 }, interactive: false }).addTo(g.pipa);
    }
    const names = ["Normal", "Waspada", "Kritis"];
    const rank = { Normal: 0, Waspada: 1, Kritis: 2 };
    for (let i = 0; i < data.inspections.length - 1; i++) {
      const a = data.inspections[i];
      const b = data.inspections[i + 1];
      const worst = names[Math.max(rank[a.status] || 0, rank[b.status] || 0)];
      L.polyline([[a.lat, a.lon], [b.lat, b.lon]], {
        color: statusStyle[worst].color,
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        interactive: false,
      }).addTo(g.pipa);
    }

    // Titik inspeksi
    data.inspections.forEach((p) => {
      const st = statusStyle[p.status] || statusStyle.Normal;
      const isSel = sel && sel.type === "inspection" && sel.id === p.id;
      if (p.conflict) {
        L.circleMarker([p.lat, p.lon], { radius: 20, color: "#EF4444", weight: 2, fill: false, className: "pulse", interactive: false }).addTo(g.ins);
      }
      const m = L.circleMarker([p.lat, p.lon], {
        radius: p.conflict ? 10 : 8,
        color: isSel ? "#FFFFFF" : "#0B1220",
        weight: isSel ? 3 : 2,
        fillColor: st.color,
        fillOpacity: 1,
      }).addTo(g.ins);
      m.on("click", () => onSelect({ type: "inspection", id: p.id }));
      if (layers.label) {
        m.bindTooltip(esc(p.code), { permanent: true, direction: "bottom", offset: [0, 8], className: "maplabel" });
      } else {
        m.bindTooltip(`<b>${esc(p.code)}</b> · ${esc(p.kp)}<br>Penipisan ${p.thinningPct}% (${esc(p.status)})`, { direction: "top", offset: [0, -8] });
      }
    });

    // Fitur arkeologi
    data.features.forEach((f) => {
      const color = zoneStyle[f.zone] ? zoneStyle[f.zone].color : "#8A9BB8";
      const isSel = sel && sel.type === "feature" && sel.id === f.id;
      const m = L.marker([f.lat, f.lon], { icon: featureIcon(L, f.type, color, isSel), title: f.name }).addTo(g.feat);
      m.on("click", () => onSelect({ type: "feature", id: f.id }));
      if (layers.label) {
        m.bindTooltip(esc(f.segmentId), { permanent: true, direction: "bottom", offset: [0, 10], className: "maplabel" });
      } else {
        m.bindTooltip(`<b>${esc(f.name)}</b><br>${esc(f.zone)} · ${esc(f.type)}`, { direction: "top", offset: [0, -10] });
      }
    });

    // Pasang layer sesuai toggle, dengan urutan tumpukan tetap
    ["zona", "pipa", "ins", "feat"].forEach((k) => {
      map.removeLayer(g[k]);
      if (layers[k]) g[k].addTo(map);
    });

    if (!fitted.current) {
      const pts = [...data.inspections.map((p) => [p.lat, p.lon]), ...data.features.map((f) => [f.lat, f.lon])];
      if (pts.length) {
        map.fitBounds(pts, { padding: [50, 50], maxZoom: 13 });
        fitted.current = true;
      }
    }
  }, [ready, data, layers, sel, onSelect]);

  // Geser peta ke item terpilih bila di luar tampilan
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !sel || !data) return;
    const item =
      sel.type === "inspection"
        ? data.inspections.find((x) => x.id === sel.id)
        : data.features.find((x) => x.id === sel.id);
    if (item && !map.getBounds().contains([item.lat, item.lon])) map.panTo([item.lat, item.lon]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, ready]);

  const conflicts = data.inspections.filter((i) => i.conflict);
  const selConflict = sel && sel.type === "inspection" ? conflicts.find((c) => c.id === sel.id) : null;
  const alertItem = selConflict || conflicts[0];
  const showAlert = alertItem && hiddenAlert !== alertItem.id;

  const fitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    const pts = [...data.inspections.map((p) => [p.lat, p.lon]), ...data.features.map((f) => [f.lat, f.lon])];
    if (pts.length) map.fitBounds(pts, { padding: [50, 50], maxZoom: 13 });
  };
  // Unduh JPG. mode "atas": judul + pencarian + panel kiri, peta, panel kanan. mode "penuh": seluruh halaman.
  const downloadJpg = async (mode = "atas") => {
    if (!boxRef.current || exporting) return;
    setExporting(true);
    try {
      const { toJpeg } = await import("html-to-image");
      const app = boxRef.current.closest(".app");
      const row = boxRef.current.closest(".row");
      const target = app || row || boxRef.current;
      const opts = {
        quality: 0.95,
        pixelRatio: mode === "penuh" ? 1.5 : 2,
        backgroundColor: "#0B1220",
        cacheBust: true,
        imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        filter: (n) =>
          !(n.classList && (n.classList.contains("leaflet-control-container") || n.classList.contains("maptools"))),
      };
      if (mode === "atas" && app && row) {
        // potong gambar sampai batas bawah baris peta (tabel di bawahnya tidak ikut)
        opts.width = app.scrollWidth;
        opts.height = Math.ceil(row.getBoundingClientRect().bottom - app.getBoundingClientRect().top);
      }
      const dataUrl = await toJpeg(target, opts);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = mode === "penuh" ? "geo-radtrack-halaman-penuh.jpg" : "geo-radtrack-dasbor.jpg";
      a.click();
    } catch (e) {
      console.error(e);
      window.alert("Gagal membuat JPG. Coba lagi, atau pakai Win+Shift+S untuk screenshot.");
    } finally {
      setExporting(false);
    }
  };
  const zoomConflict = () => {
    const map = mapRef.current;
    if (!map || !alertItem) return;
    map.setView([alertItem.lat, alertItem.lon], 15);
    setHiddenAlert(null);
  };

  return (
    <main>
      <div className="head">
        <h1>Peta Jalur Pipa &amp; Zonasi Cagar Budaya</h1>
        <div className="maptools">
          <button type="button" className="tbtn" onClick={fitAll}>Lihat semua</button>
          <button type="button" className="tbtn" onClick={zoomConflict} disabled={!alertItem}>Zoom ke konflik</button>
          <button type="button" className="tbtn" onClick={() => downloadJpg("atas")} disabled={exporting}>{exporting ? "Menyiapkan..." : "Unduh JPG"}</button>
          <button type="button" className="tbtn" onClick={() => downloadJpg("penuh")} disabled={exporting}>Unduh JPG (halaman penuh)</button>
        </div>
      </div>

      <div className="mapbox" ref={boxRef}>
        <div ref={el} className="leafmap" aria-label="Peta interaktif jalur pipa dan zonasi cagar budaya" />

        {showAlert ? (
          <div className="alert" role="alert">
            <button type="button" className="x" aria-label="Tutup peringatan" onClick={() => setHiddenAlert(alertItem.id)}>×</button>
            <div className="t">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l10 18H2z" />
                <path d="M12 10v5M12 18h.01" />
              </svg>
              KONFLIK SPASIAL TERDETEKSI
            </div>
            <p>
              Titik <b>{alertItem.code}</b> ({alertItem.kp}) menipis <b>{alertItem.thinningPct}%</b> ({alertItem.status}) dan berada
              {alertItem.distanceM !== null ? ` ${alertItem.distanceM} m dari ` : " di dekat "}
              <b>{alertItem.siteName}</b>, di dalam <b>{alertItem.zone}</b>.
            </p>
            <small>{alertItem.action}</small>
          </div>
        ) : conflicts.length === 0 ? (
          <div className="alert ok" role="status">
            <div className="t" style={{ color: "#4ADE80" }}>Tidak ada konflik spasial</div>
          </div>
        ) : null}
      </div>
      <p className="hint" style={{ margin: 0 }}>
        Peta dan analisis zona dihitung PostGIS. Basemap butuh internet; lapisan data tetap tampil tanpa basemap.
      </p>
    </main>
  );
}
