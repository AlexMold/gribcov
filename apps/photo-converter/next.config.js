/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Enable if you need to use other workspace packages
    // transpilePackages: ["@gribcov/shared"],
  },
};

module.exports = nextConfig;
