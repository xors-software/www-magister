/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Same-origin proxy to the API. Browsers (Safari, Brave, Chrome incognito,
  // Firefox-strict) drop third-party Set-Cookie when web and API live on
  // separate sites — `*.up.railway.app` is a public suffix, so subdomain
  // splits count as cross-site. Routing /api/* through Next.js makes the
  // browser see one origin; the session cookie sticks under SameSite=Lax.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://localhost:8080"}/:path*`,
      },
    ];
  },
  async redirects() {
    // The original flat URLs are kept alive so bookmarks/links from before
    // the cert-namespacing don't 404. Permanent so search engines update.
    return [
      { source: "/quiz", destination: "/claude-code/quiz", permanent: true },
      { source: "/quiz/:id", destination: "/claude-code/quiz/:id", permanent: true },
      { source: "/quiz/:id/results", destination: "/claude-code/quiz/:id/results", permanent: true },
      { source: "/scenarios", destination: "/claude-code/scenarios", permanent: true },
      // `:id([^.]+)` excludes dotted paths so the static .md files in
      // /public/scenarios/* aren't 301'd into the Next.js page route.
      // Without this the page would fetch its own HTML and render the
      // RSC payload as text.
      { source: "/scenarios/:id([^.]+)", destination: "/claude-code/scenarios/:id", permanent: true },
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