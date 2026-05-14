import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// @ts-ignore
nextConfig.turbopack = {
  root: '..'
};

export default nextConfig;
