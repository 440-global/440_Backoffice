import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "english.sse.com.cn",
      },
      {
        protocol: "https",
        hostname: "static.nike.com",
        pathname: "/a/images/**",
      },
    ],
  },
};

export default nextConfig;