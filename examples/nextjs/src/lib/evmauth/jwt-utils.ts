import type { AuthTokenPayload } from '@/types/evmauth';
import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';
import { ENV } from './config';

// JWT token expiry time in seconds (default 1 hour)
const AUTH_TOKEN_EXPIRY = ENV.AUTH_TOKEN_EXPIRY;

/**
 * Create a JWT token for an authenticated wallet
 * @param walletAddress The authenticated wallet address
 * @param options Optional settings (nonce, custom expiry)
 * @returns The JWT token string
 */
export async function createAuthToken(
    walletAddress: string,
    options?: { nonce?: string; expirySeconds?: number; demo?: boolean }
): Promise<string> {
    // Validate wallet address format
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid wallet address format');
    }

    // Create JWT payload
    const payload: AuthTokenPayload = {
        walletAddress,
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + (options?.expirySeconds || AUTH_TOKEN_EXPIRY),
    };

    // Add nonce if provided
    if (options?.nonce) {
        payload.nonce = options.nonce;
    }

    // Get encryption key
    const secret = getEncryptionKey();

    // Sign and create the JWT
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    return await new SignJWT(payload as unknown as Record<string, any>)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(payload.issuedAt)
        .setExpirationTime(payload.expiresAt)
        .setJti(nanoid())
        .sign(secret);
}

/**
 * Verify a JWT token and return the payload
 * @param token The JWT token to verify
 * @returns The token payload or null if invalid
 */
export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
    try {
        // Get encryption key
        const secret = getEncryptionKey();

        // Verify the token
        const { payload } = await jwtVerify(token, secret);

        // Check required fields
        if (!payload.walletAddress || !payload.issuedAt || !payload.expiresAt) {
            return null;
        }

        // Return typed payload
        return {
            walletAddress: payload.walletAddress as string,
            issuedAt: payload.issuedAt as number,
            expiresAt: payload.expiresAt as number,
            nonce: payload.nonce as string | undefined,
        };
    } catch (error) {
        console.error('JWT verification error:', error);
        return null;
    }
}

/**
 * Extract a JWT token from a request
 * @param req The request object
 * @returns The JWT token string or null if not found
 */
export function extractAuthToken(req: Request): string | null {
    // Check Authorization header first
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check cookies next
    const cookies = req.headers.get('Cookie');
    if (cookies) {
        // Check for evmauth_token cookie
        const evmAuthTokenMatch = cookies.match(/(?:^|;\s*)evmauth_token=([^;]*)/);
        if (evmAuthTokenMatch?.[1]) {
            return decodeURIComponent(evmAuthTokenMatch[1]);
        }
    }

    // Check for custom header that might be set by client-side code
    // This would be set if the token is stored in localStorage
    const localToken = req.headers.get('X-Auth-Token');
    if (localToken) {
        return localToken;
    }

    return null;
}

/**
 * Get the encryption key for JWT operations
 * @returns The encryption key as a Uint8Array
 */
function getEncryptionKey(): Uint8Array {
    if (!ENV.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
    }

    // Convert the JWT secret to a Uint8Array
    return new TextEncoder().encode(ENV.JWT_SECRET);
}
