import type { TokenRequirement } from './types';

/**
 * IMPORTANT SECURITY NOTICE:
 *
 * The demo wallet configuration (DEMO_PRIVATE_KEY and DEMO_WALLET_ADDRESS) is intended
 * for local development and demonstration purposes ONLY. Never use these variables
 * in a production environment or with a wallet containing real funds.
 *
 * Best practices:
 * 1. Use a burner wallet generated specifically for testing
 * 2. Never store private keys in source control
 * 3. In production, use proper wallet connection interfaces
 */

/**
 * Environment variable configuration
 * We use getters to ensure the latest environment variables are used
 */
export const ENV = {
    get EVMAUTH_CONTRACT_ADDRESS() {
        return (
            process.env.EVMAUTH_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_EVMAUTH_CONTRACT_ADDRESS
        );
    },
    get EVMAUTH_RPC_URL() {
        return process.env.EVMAUTH_RPC_URL || process.env.NEXT_PUBLIC_EVMAUTH_RPC_URL;
    },
    get JWT_SECRET() {
        return process.env.JWT_SECRET;
    },
    get AUTH_TOKEN_EXPIRY() {
        return Number(process.env.AUTH_TOKEN_EXPIRY) || 3600; // Default 1 hour
    },
    get AUTH_CHALLENGE_EXPIRY() {
        return Number(process.env.AUTH_CHALLENGE_EXPIRY) || 300; // Default 5 minutes
    },
    get APP_URL() {
        return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    },

    // Demo wallet configuration (for local development only)
    // WARNING: Never use this in production or with a wallet containing real funds
    get DEMO_PRIVATE_KEY() {
        return process.env.EVMAUTH_DEMO_PRIVATE_KEY || '';
    },
    get DEMO_WALLET_ADDRESS() {
        return process.env.EVMAUTH_DEMO_WALLET_ADDRESS || '';
    },
};

/**
 * Validate that all required environment variables are present
 */
export function validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!ENV.EVMAUTH_CONTRACT_ADDRESS) {
        errors.push('NEXT_PUBLIC_EVMAUTH_CONTRACT_ADDRESS is required');
    } else if (!ENV.EVMAUTH_CONTRACT_ADDRESS.match(/^0x[a-fA-F0-9]{40}$/)) {
        errors.push('NEXT_PUBLIC_EVMAUTH_CONTRACT_ADDRESS must be a valid Ethereum address');
    }

    if (!ENV.EVMAUTH_RPC_URL) {
        errors.push('NEXT_PUBLIC_EVMAUTH_RPC_URL is required');
    }

    if (!ENV.JWT_SECRET) {
        errors.push('JWT_SECRET is required');
    } else if (ENV.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET should be at least 32 characters long for security');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate the demo wallet configuration
 * @throws Error if the demo wallet configuration is invalid
 */
export function validateDemoWalletConfig(): void {
    if (!ENV.DEMO_PRIVATE_KEY) {
        throw new Error('EVMAUTH_DEMO_PRIVATE_KEY is not configured in environment variables');
    }

    if (!ENV.DEMO_WALLET_ADDRESS) {
        throw new Error('EVMAUTH_DEMO_WALLET_ADDRESS is not configured in environment variables');
    }

    // Basic validation of private key format
    if (!ENV.DEMO_PRIVATE_KEY.match(/^0x[0-9a-fA-F]{64}$/)) {
        throw new Error(
            'EVMAUTH_DEMO_PRIVATE_KEY must be a valid hexadecimal private key (0x + 64 hex chars)'
        );
    }

    // Basic validation of wallet address format
    if (!ENV.DEMO_WALLET_ADDRESS.match(/^0x[0-9a-fA-F]{40}$/)) {
        throw new Error(
            'EVMAUTH_DEMO_WALLET_ADDRESS must be a valid Ethereum address (0x + 40 hex chars)'
        );
    }
}

/**
 * Token requirements for protected paths
 * Maps paths to token requirements
 */
export const TOKEN_REQUIREMENTS: Record<string, TokenRequirement> = {
    // Protected paths
    '/protected': { tokenId: 0, amount: 1 },
    '/api/protected': { tokenId: 0, amount: 1 },

    // Premium paths (require a different token)
    '/protected/premium': { tokenId: 1, amount: 1 },
    '/api/protected/premium': { tokenId: 1, amount: 1 },

    // Default requirement (used as fallback)
    default: { tokenId: 0, amount: 1 },
};

/**
 * Protected path prefixes
 * Any path that starts with these prefixes will be considered protected
 */
export const PROTECTED_PATH_PREFIXES = ['/protected', '/api/protected'];

/**
 * Authentication paths that should be excluded from protection
 */
export const AUTH_PATHS = ['/api/auth', '/login', '/token-required'];

/**
 * Static paths that should be excluded from middleware processing
 */
export const STATIC_PATHS = ['/_next', '/favicon.ico', '/api/health'];

/**
 * Check if a path is protected
 * @param pathname The path to check
 * @returns True if the path is protected
 */
export function isProtectedPath(pathname: string): boolean {
    // Check if the path starts with any of the protected prefixes
    return PROTECTED_PATH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

/**
 * Check if a path is an authentication path
 * @param pathname The path to check
 * @returns True if the path is an authentication path
 */
export function isAuthPath(pathname: string): boolean {
    return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Check if a path is a static path
 * @param pathname The path to check
 * @returns True if the path is a static path
 */
export function isStaticPath(pathname: string): boolean {
    return STATIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Get the token requirement for a path
 * @param pathname The path to check
 * @returns The token requirement for the path
 */
export function getTokenRequirementForPath(pathname: string): TokenRequirement {
    // First, check for exact match
    if (TOKEN_REQUIREMENTS[pathname]) {
        return TOKEN_REQUIREMENTS[pathname];
    }

    // Then check for prefix match (longest prefix first)
    const matchingPrefixes = PROTECTED_PATH_PREFIXES.filter((prefix) =>
        pathname.startsWith(`${prefix}/`)
    ).sort((a, b) => b.length - a.length); // Sort by length descending

    if (matchingPrefixes.length > 0) {
        const prefix = matchingPrefixes[0];
        return TOKEN_REQUIREMENTS[prefix] || TOKEN_REQUIREMENTS.default;
    }

    // Default requirement
    return TOKEN_REQUIREMENTS.default;
}
