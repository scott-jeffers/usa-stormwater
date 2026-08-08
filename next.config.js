/** @type {import('next').NextConfig} */
const repoName = "usa-stormwater";
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

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
  ...(isGithubActions
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
      }
    : {}),
};

module.exports = nextConfig;
