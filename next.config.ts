import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration for Next.js 16
  turbopack: {
    // FFmpeg is loaded dynamically at runtime, so no special config needed
  },
  // Keep webpack config for compatibility, but it won't be used with Turbopack
  webpack: (config, { isServer }) => {
    // Exclude FFmpeg from server-side bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@ffmpeg/ffmpeg': 'commonjs @ffmpeg/ffmpeg',
        '@ffmpeg/util': 'commonjs @ffmpeg/util',
      });
    }
    
    // Allow dynamic imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
};

export default nextConfig;
