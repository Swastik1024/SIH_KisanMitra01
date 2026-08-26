/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '172.20.10.2',
    '172.18.105.20',
    '10.238.35.20',
    '10.22.21.20',   // ✅ new
  ],
};

export default nextConfig;
