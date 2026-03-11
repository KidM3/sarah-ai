import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the webhook body is not parsed by Next.js default body parser
  // (handled manually in the route for signature verification)
  experimental: {},
};

export default nextConfig;
