-- ============================================================
-- DATA AWAL (SIMULASI)
-- File ini juga dipakai tombol "Reset database" di web, jadi
-- harus aman dijalankan berulang (TRUNCATE di awal).
-- ============================================================
TRUNCATE inspections, archaeo_features, zone_rules, app_config RESTART IDENTITY;

-- Ambang penipisan: ASUMSI SIMULASI, ganti dengan kriteria Anggota 1 (Teknik Nuklir)
INSERT INTO app_config (id, warn_pct, crit_pct) VALUES (1, 15, 30);

-- Matriks zonasi sensitivitas arkeologi (dari tabel matriks tim)
-- aturan = Metode Pemeliharaan & Inspeksi Pipa (dipakai di kolom rekomendasi inspeksi)
-- radius_m: Merah 300 m, Kuning 1.000 m (batas luar zona), Hijau tanpa buffer
INSERT INTO zone_rules (zone, sort, header, sensitivitas, kriteria, tanah, aturan, protokol, darurat, radius_m) VALUES
('Zona Merah', 1, 'Zona Merah (Sensitif Tinggi)',
 'S ≥ 0,75 (Sangat Tinggi)',
 'Radius 0–300 m dari situs candi terdaftar, permukiman kuno utuh, atau cagar budaya pesisir.',
 'Stratigrafi utuh/dangkal (< 2 m), rentan terhadap kompresi dan getaran.',
 'Dilarang total galian mekanis & alat berat (trenchless only). Wajib inspeksi non-kontak Radiometri Gamma (Cs-137).',
 'Pemantauan penuh integritas pipa tanpa membuka permukaan tanah.',
 'Pemutusan aktivitas fisik total jika terdeteksi anomali bawah permukaan baru.',
 300),
('Zona Kuning', 2, 'Zona Kuning (Penyangga / Potensial)',
 '0,30 ≤ S < 0,75 (Sedang)',
 'Radius 300–1.000 m dari situs sejarah, endapan aluvial sungai purba, atau jalur pos kuno.',
 'Terdapat lapisan endapan aluvial (palaeo-alluvial) berpotensi artefak sekunder.',
 'Ekskavasi manual/terbatas diizinkan dengan pembatasan getaran mesin (PPV < 2 mm/s).',
 'Meminta pendampingan ahli arkeologi (watching brief) selama penggalian.',
 'Penerapan Chance Find Procedure (CFP): hentikan pekerjaan radius 10 m jika artefak ditemukan.',
 1000),
('Zona Hijau', 3, 'Zona Hijau (Steril)',
 'S < 0,30 (Rendah / Steril)',
 'Area aluvial muda, lahan industri/urukan modern yang terkonfirmasi steril cagar budaya.',
 'Lapisan tanah hasil galian/urukan teknis modern (reclaimed land).',
 'Prosedur perawatan teknis dan galian mekanis standar industri migas bebas dieksekusi.',
 'Pemantauan rutin keandalan pipa (routine maintenance).',
 'Penanganan chance find umum sesuai regulasi standar.',
 0);

-- Sampel Data Spasial Koridor CISEM (Cirebon – Semarang), dari tabel tim
INSERT INTO archaeo_features (segment_id, kp, name, type, lat, lon, target_zone) VALUES
('SEG-CISEM-01', 'KP 05+200 (Cirebon)',   'Situs Muara Purba & Cagar Budaya Pesisir Cirebon',        'Polygon',    -6.7052, 108.5711, 'Zona Merah'),
('SEG-CISEM-02', 'KP 42+100 (Brebes)',    'Jalur Pos Kuno Deandels (Grote Postweg) Segmen Brebes',   'LineString', -6.8712, 109.0423, 'Zona Kuning'),
('SEG-CISEM-03', 'KP 88+500 (Pemalang)',  'Endapan Aluvial Purba Sungai Comal',                      'Polygon',    -6.8921, 109.5284, 'Zona Kuning'),
('SEG-CISEM-04', 'KP 130+400 (Batang)',   'Situs Candi Batu Bata Purba (Baleagung/Pesisir Batang)',  'Point',      -6.9015, 109.8122, 'Zona Merah'),
('SEG-CISEM-05', 'KP 165+800 (Kendal)',   'Kawasan Industri Terpadu / Lahan Urukan Modern Kendal',   'Polygon',    -6.9201, 110.2014, 'Zona Hijau'),
('SEG-CISEM-06', 'KP 195+000 (Semarang)', 'Kawasan Pelabuhan & Kota Lama Semarang (Pesisir Purba)',  'Polygon',    -6.9682, 110.4289, 'Zona Merah');

-- Titik inspeksi radiometri: DATA SIMULASI buatan, bukan hasil pengukuran nyata.
-- Diletakkan dekat tiap segmen di atas supaya analisis zona tetap jalan.
INSERT INTO inspections (code, kp, lat, lon, nominal_mm, measured_mm) VALUES
('INS-01', 'KP 05+200 (Cirebon)',   -6.7048, 108.5720, 10.00, 9.60),
('INS-02', 'KP 42+100 (Brebes)',    -6.8718, 109.0440, 10.00, 8.00),
('INS-03', 'KP 88+500 (Pemalang)',  -6.8930, 109.5300, 10.00, 8.80),
('INS-04', 'KP 130+400 (Batang)',   -6.9008, 109.8130, 10.00, 6.50),
('INS-05', 'KP 165+800 (Kendal)',   -6.9196, 110.2019, 10.00, 8.40),
('INS-06', 'KP 195+000 (Semarang)', -6.9675, 110.4297, 10.00, 8.20);
