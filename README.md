# GEO-RADTRACK WebGIS (Next.js + PostGIS)

Prototipe sistem integrasi untuk poster Forum Inovasi Produksi Hulu Migas 2026.
**Semua data adalah simulasi.**

Alur sistem (sesuai flowchart tim):

```
Input data (pipa, inspeksi radiometri, zonasi situs)
   -> tabel PostGIS (validasi lewat CHECK constraint)
   -> analisis spasial di database (ST_Buffer, ST_Intersects, ST_Distance)
   -> deteksi konflik: penipisan Kritis di dalam Zona Merah
   -> dasbor WebGIS: peta, layer, alert, rekomendasi, izin kerja
   -> data diperbarui dari web, analisis dihitung ulang
```

## Menjalankan

Prasyarat: Docker Desktop (berjalan) dan Node.js LTS.

```bash
docker compose up -d     # pertama kali mengunduh image PostGIS (sekitar 1 menit)
npm install              # ada dependensi baru: pg dan leaflet
npm run dev
```

Buka http://localhost:3000.

PostGIS memakai port **5433** di komputermu, supaya tidak bentrok dengan Postgres lokal (5432).
Skema dan data awal (`db/init/*.sql`) dijalankan otomatis hanya saat database pertama dibuat.

### Kalau skema atau data awal diubah

```bash
npm run db:reset         # menghapus volume lalu membuat ulang dari db/init/*.sql
```

### Melihat langsung di database

```bash
docker exec -it geo-radtrack-db psql -U geo -d georadtrack
```

Atau sambungkan DBeaver/pgAdmin ke `127.0.0.1`, port `5433`, user `geo`, password `geo123`, database `georadtrack`.

Contoh query:

```sql
SELECT * FROM v_inspection_analysis;                 -- hasil analisis tiap titik
SELECT * FROM v_inspection_analysis WHERE conflict;  -- konflik spasial
SELECT feature_name, zone, radius_m, ST_AsText(geom) FROM v_zone_polygons;
```

## Cara kerja analisis spasial

Semuanya ada di `db/init/01-schema.sql`:

| Objek | Fungsi |
| --- | --- |
| `zone_rules` | Matriks zonasi (sensitivitas, kriteria, tanah, metode, protokol, darurat) + `radius_m` (jarak buffer tiap zona) |
| `archaeo_features` | Fitur arkeologi (sampel data spasial), kolom `geom` dibuat otomatis dari lat/lon |
| `inspections` | Titik inspeksi radiometri: ketebalan nominal dan terukur |
| `v_zone_polygons` | `ST_Buffer` tiap situs sejauh radius zonanya |
| `v_inspection_status` | Penipisan %, status (Normal/Waspada/Kritis), zona via `ST_Intersects`, jarak via `ST_Distance` |
| `v_inspection_analysis` | Menambah izin kerja dan rekomendasi |

Konflik = status **Kritis** dan titik berada di **Zona Merah** (sama dengan logika slide Pilar 3).
Kalau satu titik masuk beberapa zona, yang dipakai zona paling ketat.

## Edit dari web

Klik **Edit data** di kanan atas.

- **Sampel Data Spasial**: ubah koordinat, tipe, dan Target_Zone. Tekan Enter atau klik di luar sel untuk menyimpan.
- **Data Inspeksi**: ubah ketebalan atau koordinat. Status, zona, jarak, dan izin kerja ikut berubah (dihitung PostGIS).
- **Matriks Zonasi**: ubah teks dan **radius buffer**. Radius mengubah ukuran zona di peta.
- **Reset database ke data awal**: menjalankan ulang `db/init/02-seed.sql`.

## Struktur folder

```
geo-radtrack-web/
├── docker-compose.yml         # PostGIS di port 5433
├── db/init/
│   ├── 01-schema.sql          # tabel, view, analisis spasial
│   └── 02-seed.sql            # data awal (juga dipakai tombol Reset)
├── app/
│   ├── api/                   # dashboard, features, inspections, rules, reset
│   ├── layout.js, page.js, globals.css
├── components/                # Dashboard, MapView (Leaflet), tabel, panel
├── lib/                       # db.js (koneksi), crud.js (validasi), dll
├── data/dashboard.js          # konstanta tampilan (warna, daftar zona)
└── .env.example               # ganti DATABASE_URL bila perlu
```

## Mengubah ambang status

Ambang penipisan ada di tabel `app_config` (asumsi awal: Waspada 15%, Kritis 30%):

```sql
UPDATE app_config SET warn_pct = 10, crit_pct = 25;
```

Ganti dengan kriteria asli dari anggota Teknik Nuklir sebelum dipakai di poster.

## Catatan penting

- Data titik inspeksi dan ambang status adalah **simulasi buatan**, bukan hasil pengukuran.
- Radius buffer: Merah 300 m, Kuning 1.000 m (batas luar zona). Ini penyederhanaan dari matriks.
- KP dan koordinat pada sampel data spasial tidak konsisten satu sama lain. Analisis memakai koordinat.
- Basemap (CARTO/OSM/Esri) butuh internet. Tanpa internet, lapisan data tetap tampil.
- Untuk poster, tulis sebagai **prototipe** dengan data simulasi. Jangan klaim sebagai hasil lapangan.

## Memakai Postgres yang sudah ada (tanpa Docker)

Postgres harus punya ekstensi PostGIS terpasang. Buat database, jalankan
`db/init/01-schema.sql` lalu `02-seed.sql`, dan set `DATABASE_URL` di `.env.local`
(lihat `.env.example`).
