-- ============================================================
-- GEO-RADTRACK: skema PostGIS
-- Dijalankan otomatis oleh Docker saat database pertama kali dibuat.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- Matriks zonasi sensitivitas arkeologi.
-- radius_m = jarak buffer dari situs untuk zona itu (dipakai ST_Buffer).
CREATE TABLE zone_rules (
  zone         text PRIMARY KEY,
  sort         int  NOT NULL,
  header       text NOT NULL,
  kriteria     text NOT NULL DEFAULT '',   -- Kriteria Spasial (RFM)
  sensitivitas text NOT NULL DEFAULT '',   -- Nilai Sensitivitas (S)
  tanah        text NOT NULL DEFAULT '',   -- Karakteristik Tanah
  aturan       text NOT NULL DEFAULT '',   -- Metode Pemeliharaan & Inspeksi Pipa (dipakai di rekomendasi)
  protokol     text NOT NULL DEFAULT '',   -- Protokol Pemantauan
  darurat      text NOT NULL DEFAULT '',   -- Prosedur Darurat
  radius_m     numeric NOT NULL DEFAULT 0 CHECK (radius_m >= 0)
);

-- Ambang status penipisan dinding pipa (persen). Satu baris saja.
CREATE TABLE app_config (
  id       int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  warn_pct numeric NOT NULL,
  crit_pct numeric NOT NULL
);

-- Fitur arkeologi (sampel data spasial)
CREATE TABLE archaeo_features (
  id          serial PRIMARY KEY,
  segment_id  text NOT NULL,
  kp          text NOT NULL DEFAULT '',
  name        text NOT NULL,
  type        text NOT NULL DEFAULT 'Point',
  lat         double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lon         double precision NOT NULL CHECK (lon BETWEEN -180 AND 180),
  target_zone text NOT NULL REFERENCES zone_rules(zone) ON UPDATE CASCADE,
  geom        geometry(Point, 4326)
              GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED
);
CREATE INDEX archaeo_features_geom_idx ON archaeo_features USING GIST (geom);

-- Titik inspeksi radiometri / NDT di sepanjang jalur pipa
CREATE TABLE inspections (
  id          serial PRIMARY KEY,
  code        text NOT NULL,
  kp          text NOT NULL DEFAULT '',
  lat         double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lon         double precision NOT NULL CHECK (lon BETWEEN -180 AND 180),
  nominal_mm  numeric(7,2) NOT NULL CHECK (nominal_mm > 0),
  measured_mm numeric(7,2) NOT NULL CHECK (measured_mm >= 0),
  geom        geometry(Point, 4326)
              GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED
);
CREATE INDEX inspections_geom_idx ON inspections USING GIST (geom);

-- ------------------------------------------------------------
-- VIEW 1: poligon zona = buffer situs sejauh radius zonanya
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_zone_polygons AS
SELECT
  f.id                AS feature_id,
  f.segment_id,
  f.name              AS feature_name,
  f.target_zone       AS zone,
  r.sort,
  r.radius_m::float8  AS radius_m,
  f.geom              AS site_geom,
  ST_Buffer(f.geom::geography, r.radius_m::float8)::geometry AS geom
FROM archaeo_features f
JOIN zone_rules r ON r.zone = f.target_zone
WHERE r.radius_m > 0;

-- ------------------------------------------------------------
-- VIEW 2: status tiap titik inspeksi + zona yang dilaluinya
--   penipisan % = (1 - terukur / nominal) * 100
--   zona        = zona paling ketat yang poligonnya memuat titik (ST_Intersects)
--   konflik     = status Kritis DAN berada di Zona Merah
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_inspection_status AS
WITH base AS (
  SELECT i.*,
         GREATEST(0, (1 - i.measured_mm / i.nominal_mm) * 100) AS pct,
         COALESCE(
           (regexp_match(i.kp, '(\d+)\s*\+\s*(\d+)'))[1]::int * 1000
           + (regexp_match(i.kp, '(\d+)\s*\+\s*(\d+)'))[2]::int,
           0) AS kp_m
  FROM inspections i
)
SELECT
  b.id, b.code, b.kp, b.kp_m, b.lat, b.lon, b.geom,
  b.nominal_mm::float8  AS nominal_mm,
  b.measured_mm::float8 AS measured_mm,
  ROUND(b.pct, 1)::float8 AS thinning_pct,
  s.status,
  COALESCE(z.zone, 'Zona Hijau') AS zone,
  z.feature_name AS site_name,
  z.distance_m,
  (s.status = 'Kritis' AND COALESCE(z.zone, 'Zona Hijau') = 'Zona Merah') AS conflict
FROM base b
CROSS JOIN app_config c
CROSS JOIN LATERAL (
  SELECT CASE WHEN b.pct >= c.crit_pct THEN 'Kritis'
              WHEN b.pct >= c.warn_pct THEN 'Waspada'
              ELSE 'Normal' END AS status
) s
LEFT JOIN LATERAL (
  SELECT zp.zone, zp.feature_name,
         ST_Distance(b.geom::geography, zp.site_geom::geography) AS distance_m
  FROM v_zone_polygons zp
  WHERE ST_Intersects(b.geom, zp.geom)
  ORDER BY zp.sort, distance_m
  LIMIT 1
) z ON true;

-- ------------------------------------------------------------
-- VIEW 3: izin kerja dan rekomendasi (Smart Maintenance Clearance)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_inspection_analysis AS
SELECT
  s.*,
  CASE
    WHEN s.conflict THEN 'Ditahan'
    WHEN s.zone = 'Zona Merah' THEN 'Bersyarat'
    WHEN s.zone = 'Zona Kuning' AND s.status <> 'Normal' THEN 'Bersyarat'
    ELSE 'Terbit otomatis'
  END AS permit,
  CASE
    WHEN s.conflict THEN 'Tanpa galian: perbaikan trenchless (CIPP atau HDD). ' || COALESCE(r.aturan, '')
    WHEN s.zone = 'Zona Merah' THEN COALESCE(r.aturan, '')
    WHEN s.zone = 'Zona Kuning' AND s.status <> 'Normal' THEN COALESCE(r.aturan, '')
    WHEN s.status <> 'Normal' THEN 'Jadwalkan perawatan standar. ' || COALESCE(r.aturan, '')
    ELSE 'Pemantauan rutin.'
  END AS action
FROM v_inspection_status s
LEFT JOIN zone_rules r ON r.zone = s.zone;
