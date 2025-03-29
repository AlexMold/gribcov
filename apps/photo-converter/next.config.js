/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  experimental: {
    // Enable if you need to use other workspace packages
    transpilePackages: ["@gribcov/shared"],
  },
};

module.exports = nextConfig;
