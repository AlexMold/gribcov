/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  output: "export",
  experimental: {
    // Enable if you need to use other workspace packages
    transpilePackages: ["@gribcov/shared"],
  },
};

module.exports = nextConfig;
