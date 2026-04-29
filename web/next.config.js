/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // The original flat URLs are kept alive so bookmarks/links from before
    // the cert-namespacing don't 404. Permanent so search engines update.
    return [
      { source: "/quiz", destination: "/claude-code/quiz", permanent: true },
      { source: "/quiz/:id", destination: "/claude-code/quiz/:id", permanent: true },
      { source: "/quiz/:id/results", destination: "/claude-code/quiz/:id/results", permanent: true },
      { source: "/scenarios", destination: "/claude-code/scenarios", permanent: true },
      { source: "/scenarios/:id", destination: "/claude-code/scenarios/:id", permanent: true },
      { source: "/dashboard", destination: "/claude-code/dashboard", permanent: true },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.center.app',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'nft-cdn.alchemy.com',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'i.seadn.io',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'cloudflare-ipfs.com',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'gateway.pinata.cloud',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'openseauserdata.com',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'storage.googleapis.com',
      // },
      // {
      //   protocol: 'https',
      //   hostname: '**.googleusercontent.com',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'ipfs.io',
      // },
      // {
      //   protocol: 'https',
      //   hostname: 'res.cloudinary.com',
      // },
    ],
  },
}

module.exports = nextConfig