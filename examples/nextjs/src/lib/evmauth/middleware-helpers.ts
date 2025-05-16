import type { NextRequest } from 'next/server';

/**
 * Define token requirements for different paths
 */
export interface TokenRequirement {
    tokenId: number;
    amount: number;
}

/**
 * Get token requirement for a specific path
 */
export function getTokenRequirementForPath(pathname: string): TokenRequirement {
    // Premium content requires token ID 1
    if (pathname.includes('/premium')) {
        return { tokenId: 1, amount: 1 };
    }

    // Default to token ID 0 for basic access
    return { tokenId: 0, amount: 1 };
}

/**
 * Check if a path is a protected route
 */
export function isProtectedPath(pathname: string): boolean {
    return pathname.startsWith('/api/protected');
}

/**
 * Check if a path is a static file (should be excluded from middleware)
 */
export function isStaticPath(pathname: string): boolean {
    return (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/robots.txt') ||
        pathname.startsWith('/public')
    );
}

/**
 * Extract wallet address from request
 * @param req The request object
 * @returns The wallet address or null if not found
 */
export function extractWalletAddress(req: Request): string | null {
    const url = new URL(req.url);
    return url.searchParams.get('address');
}
