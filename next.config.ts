import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler is stable in Next 16. Frame-loop components that mutate
  // refs in useFrame opt out individually with 'use no memo'.
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // three/webgpu ships ESM with top-level await in its node graph.
  transpilePackages: ["three"],
};

export default nextConfig;
