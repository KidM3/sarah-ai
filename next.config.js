/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the webhook body is not parsed by Next.js default body parser
  // (handled manually in the route for signature verification)
  experimental: {},
};

module.exports = nextConfig;
