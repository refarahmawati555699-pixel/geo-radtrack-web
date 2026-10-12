/** @type {import('next').NextConfig} */
const nextConfig = {
  // Driver Postgres dijalankan di server saja
  serverExternalPackages: ["pg"],
  // Supaya tombol "Reset database" bisa membaca db/init/02-seed.sql saat di-deploy ke Vercel
  outputFileTracingIncludes: {
    "/api/reset": ["./db/init/**/*"],
  },
};

export default nextConfig;
