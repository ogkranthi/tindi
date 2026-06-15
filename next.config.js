/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server bundle in .next/standalone for a small Docker image.
  output: "standalone",
  // better-sqlite3 is a native module; keep it external so Next doesn't try to bundle it.
  serverExternalPackages: ["better-sqlite3"],
};

module.exports = nextConfig;
