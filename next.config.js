/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['mongodb', 'pdfkit'],
  async headers() {
    const headersList = [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none';" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];

    if (process.env.CORS_ORIGINS) {
      headersList.push({
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGINS },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      });
    }

    return headersList;
  },
};

module.exports = nextConfig;
