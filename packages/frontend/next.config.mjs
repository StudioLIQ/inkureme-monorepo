import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // In a monorepo, help Next trace files correctly
  outputFileTracingRoot: path.join(__dirname, '../..'),
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Stub optional Node-only deps that break client builds
      'pino-pretty': false,
      'pino-abstract-transport': false,
      'sonic-boom': false,
    }
    return config
  },
};

export default nextConfig;
