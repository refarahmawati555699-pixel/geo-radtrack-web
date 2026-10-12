"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "./Header";
import LayerPanel from "./LayerPanel";
import MapView from "./MapView";
import DetailPanel from "./DetailPanel";
import StatusStrip from "./StatusStrip";
import DataTable from "./DataTable";
import InspectionTable from "./InspectionTable";
import ZoneMatrix from "./ZoneMatrix";

function ErrorBox({ message }) {
  return (
    <div className="errbox" role="alert">
      <b>Tidak bisa memuat data dari database.</b>
      <p>{message}</p>
      <ol>
        <li>Pastikan Docker Desktop berjalan.</li>
        <li>Di folder project, jalankan <code>docker compose up -d</code>.</li>
        <li>Tunggu sekitar 10 detik, lalu muat ulang halaman ini.</li>
      </ol>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [layers, setLayers] = useState({ pipa: true, zona: true, ins: true, feat: true, label: false });
  const [sel, setSel] = useState(null);
  const [query, setQuery] = useState("");

  // Ambil semua data (termasuk hasil analisis PostGIS) dari API
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/dashboard", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Gagal memuat data");
      setData(j);
      setError(null);
      setSel((cur) => {
        if (cur) {
          const exists =
            cur.type === "inspection" ? j.inspections.some((x) => x.id === cur.id) : j.features.some((x) => x.id === cur.id);
          if (exists) return cur;
        }
        const first = j.inspections.find((x) => x.conflict) || j.inspections[0];
        if (first) return { type: "inspection", id: first.id };
        return j.features[0] ? { type: "feature", id: j.features[0].id } : null;
      });
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Kirim perubahan ke API, lalu muat ulang agar hasil analisis ikut diperbarui
  const mutate = useCallback(
    async (url, method, body) => {
      try {
        const r = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Gagal menyimpan (${r.status})`);
        setNotice(null);
        return j;
      } catch (e) {
        setNotice(e.message || String(e));
        return null;
      } finally {
        await load();
      }
    },
    [load]
  );

  const login = async (password) => {
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return j.error || "Gagal login";
      await load();
      return null;
    } catch (e) {
      return e.message || String(e);
    }
  };
  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    await load();
  };

  const toggleLayer = (id) => setLayers((prev) => ({ ...prev, [id]: !prev[id] }));

  // ----- fitur arkeologi -----
  const updateFeature = (id, field, value) => mutate(`/api/features/${id}`, "PATCH", { [field]: value });
  const addFeature = async () => {
    const base = data.features[0];
    const n = data.features.length + 1;
    const j = await mutate("/api/features", "POST", {
      segmentId: `SEG-CISEM-${String(n).padStart(2, "0")}`,
      kp: "",
      name: "Fitur baru",
      type: "Point",
      lat: base ? base.lat : -6.9,
      lon: base ? base.lon : 109.5,
      zone: "Zona Hijau",
    });
    if (j && j.id) setSel({ type: "feature", id: j.id });
  };
  const deleteFeature = (id) => {
    if (window.confirm("Hapus baris ini dari database?")) mutate(`/api/features/${id}`, "DELETE");
  };

  // ----- titik inspeksi -----
  const updateInspection = (id, field, value) => mutate(`/api/inspections/${id}`, "PATCH", { [field]: value });
  const addInspection = async () => {
    const base = data.inspections[data.inspections.length - 1];
    const n = data.inspections.length + 1;
    const j = await mutate("/api/inspections", "POST", {
      code: `INS-${String(n).padStart(2, "0")}`,
      kp: "",
      lat: base ? base.lat : -6.9,
      lon: base ? base.lon : 109.5,
      nominalMm: 10,
      measuredMm: 10,
    });
    if (j && j.id) setSel({ type: "inspection", id: j.id });
  };
  const deleteInspection = (id) => {
    if (window.confirm("Hapus titik inspeksi ini dari database?")) mutate(`/api/inspections/${id}`, "DELETE");
  };

  // ----- matriks zonasi dan reset -----
  const updateRule = (zone, field, value) => mutate(`/api/rules/${encodeURIComponent(zone)}`, "PATCH", { [field]: value });
  const resetAll = () => {
    if (window.confirm("Kembalikan SEMUA data di database ke contoh awal? Perubahanmu akan hilang.")) {
      mutate("/api/reset", "POST");
    }
  };

  if (!data) {
    return (
      <div className="app">
        <Header query={query} onQuery={setQuery} db={null} error={error} admin={false} />
        <div className="lower">
          {error ? <ErrorBox message={error} /> : <p className="sub">Memuat data dari PostGIS...</p>}
        </div>
      </div>
    );
  }

  const admin = !!data.admin;

  return (
    <div className="app">
      <Header query={query} onQuery={setQuery} db={data.db} error={error} admin={admin} onLogin={data.canLogin ? login : undefined} onLogout={data.canLogin ? logout : undefined} />
      {notice && (
        <div className="notice" role="alert">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Tutup pesan">×</button>
        </div>
      )}
      {error && !notice && (
        <div className="notice" role="alert">
          <span>{error}</span>
        </div>
      )}

      <div className="row">
        <LayerPanel layers={layers} onToggle={toggleLayer} rules={data.rules} config={data.config} />
        <MapView data={data} layers={layers} sel={sel} onSelect={setSel} />
        <DetailPanel data={data} sel={sel} />
      </div>

      <div id="data" className="lower">
        <DataTable
          admin={admin}
          features={data.features}
          rules={data.rules}
          sel={sel}
          query={query}
          onSelect={setSel}
          onUpdate={updateFeature}
          onAdd={addFeature}
          onDelete={deleteFeature}
          onReset={resetAll}
        />
        <InspectionTable
          admin={admin}
          inspections={data.inspections}
          sel={sel}
          query={query}
          onSelect={setSel}
          onUpdate={updateInspection}
          onAdd={addInspection}
          onDelete={deleteInspection}
        />
        <ZoneMatrix admin={admin} rules={data.rules} onUpdate={updateRule} />
      </div>

      <StatusStrip data={data} />
    </div>
  );
}
