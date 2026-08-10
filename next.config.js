/** @type {import('next').NextConfig} */
// Static export for Netlify (publish directory: out). Custom domain is
// configured in the Netlify dashboard — no GitHub Pages basePath needed.
const nextConfig = {
  output: "export",
  agentRules: false,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
