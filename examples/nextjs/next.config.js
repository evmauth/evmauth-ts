/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        // Next.js 15 supports server actions by default, so we don't need to enable them explicitly
        // serverActions: true,
    },
    // Prevent server middleware from running in static export
    // But enable it during development and server-based deployments
    skipMiddlewareUrlNormalize: true,
    skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
