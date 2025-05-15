/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        serverActions: true,
    },
    // Prevent server middleware from running in static export
    // But enable it during development and server-based deployments
    skipMiddlewareUrlNormalize: true,
    skipTrailingSlashRedirect: true,
};

export default nextConfig;
