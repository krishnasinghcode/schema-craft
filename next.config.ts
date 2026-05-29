import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress Prisma binary warning in dev
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
