import type { NextConfig } from 'next';
import path from 'node:path';

const workspaceRoot = path.resolve(process.cwd(), '../..');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
  experimental: {
    useTypeScriptCli: true,
  },
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
