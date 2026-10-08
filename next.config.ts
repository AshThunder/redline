import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/opengraph-image": ["./lib/fonts/**/*"],
    "/s/[token]/opengraph-image": ["./lib/fonts/**/*"],
  },
};

export default nextConfig;
