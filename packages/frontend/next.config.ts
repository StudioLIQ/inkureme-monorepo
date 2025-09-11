import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // In a monorepo, help Next trace files correctly
  outputFileTracingRoot: path.join(__dirname, '../..'),
  eslint: {
    // Do not block production builds on ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Do not block production builds on TS errors (optional safety net)
    ignoreBuildErrors: true,
  },
  // Webpack (production build) aliases to stub Node-only deps in browser bundles
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pino-pretty': false as unknown as string,
      'pino-abstract-transport': false as unknown as string,
      'sonic-boom': false as unknown as string,
    }
    return config
  },
  turbopack: {
    // Mirror previous Webpack aliases in Turbopack
    resolveAlias: {
      'pino-pretty': path.join(__dirname, 'lib/empty.ts'),
      'pino-abstract-transport': path.join(__dirname, 'lib/empty.ts'),
      'sonic-boom': path.join(__dirname, 'lib/empty.ts'),
    },
  },
}

export default nextConfig
