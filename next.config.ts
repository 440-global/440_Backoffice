import type { NextConfig } from "next";

const isCloudflarePages = process.env.CF_PAGES === "1";

const nextConfig: NextConfig = {
  output: isCloudflarePages ? "export" : "standalone",
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