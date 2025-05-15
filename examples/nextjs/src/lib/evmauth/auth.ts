import type { AuthResult, ChallengeResult } from '@/types/evmauth';
import { verifyMessage } from 'ethers';
import { nanoid } from 'nanoid';
import { hasRequiredTokens } from './blockchain';
import { ENV, validateDemoWalletConfig } from './config';
import { createAuthToken, verifyAuthToken } from './jwt-utils';
import { logger } from './logger';

// Challenge expiry time in seconds (default 5 minutes)
const AUTH_CHALLENGE_EXPIRY = ENV.AUTH_CHALLENGE_EXPIRY;

// In-memory challenge store (in a production app, use Redis or another distributed cache)
const CHALLENGE_STORE: Record<string, { challenge: string; expiresAt: number }> = {};

/**
 * Generate a challenge message for authentication
 * @returns The challenge result
 */
export function generateChallenge(): ChallengeResult {
    try {
        // Generate a nonce
        const nonce = nanoid();

        // Generate the message
        const challenge = `Sign this message to authenticate with EVMAuth: ${nonce}`;

        // Set expiry time
        const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CHALLENGE_EXPIRY;

        // Store challenge for later verification
        CHALLENGE_STORE[nonce] = {
            challenge,
            expiresAt,
        };

        // Schedule cleanup
        setTimeout(() => {
            delete CHALLENGE_STORE[nonce];
        }, AUTH_CHALLENGE_EXPIRY * 1000);

        // Return the challenge
        return {
            success: true,
            challenge,
            nonce,
            expiresAt: new Date(expiresAt * 1000).toISOString(),
        };
    } catch (error) {
        console.error('Failed to generate challenge:', error);

        return {
            success: false,
            error: 'Failed to generate challenge',
        };
    }
}

/**
 * Verify a signed challenge
 * @param nonce The challenge nonce
 * @param signature The signature to verify
 * @returns The wallet address if verification succeeds, null otherwise
 */
export function verifySignature(nonce: string, signature: string): string | null {
    try {
        // Get challenge from store
        const stored = CHALLENGE_STORE[nonce];

        // Verify challenge exists and hasn't expired
        if (!stored || stored.expiresAt < Math.floor(Date.now() / 1000)) {
            return null;
        }

        // Verify signature
        const walletAddress = verifyMessage(stored.challenge, signature);

        // Cleanup challenge (one-time use)
        delete CHALLENGE_STORE[nonce];

        // Return the verified wallet address
        return walletAddress;
    } catch (error) {
        console.error('Signature verification failed:', error);
        return null;
    }
}

/**
 * Complete the authentication process
 * @param nonce The challenge nonce
 * @param signature The signature to verify
 * @returns The authentication result
 */
export async function authenticateUser(nonce: string, signature: string): Promise<AuthResult> {
    try {
        // Verify signature and get wallet address
        const walletAddress = verifySignature(nonce, signature);

        // Check if verification failed
        if (!walletAddress) {
            return {
                success: false,
                error: 'Invalid signature or expired challenge',
                errorCode: 'AUTH_INVALID',
            };
        }

        // Generate JWT token
        const token = await createAuthToken(walletAddress, { nonce });

        // Return successful authentication
        return {
            success: true,
            token,
            walletAddress,
        };
    } catch (error) {
        console.error('Authentication failed:', error);

        return {
            success: false,
            error: 'Authentication failed',
            errorCode: 'SERVER_ERROR',
        };
    }
}

/**
 * Verify a user's authentication
 * @param token The JWT token to verify
 * @returns The authentication result
 */
export async function verifyAuthentication(token: string): Promise<AuthResult> {
    try {
        // Verify token
        const payload = await verifyAuthToken(token);

        // Check if token is invalid
        if (!payload) {
            return {
                success: false,
                error: 'Invalid or expired token',
                errorCode: 'AUTH_INVALID',
            };
        }

        // Return successful verification
        return {
            success: true,
            walletAddress: payload.walletAddress,
        };
    } catch (error) {
        console.error('Token verification failed:', error);

        return {
            success: false,
            error: 'Token verification failed',
            errorCode: 'SERVER_ERROR',
        };
    }
}

/**
 * Check if a user has access to a resource
 * @param token The JWT token to verify
 * @param tokenId The token ID required for access
 * @param amount The amount of tokens required
 * @returns The authentication result with additional token verification
 */
export async function checkAccess(
    token: string,
    tokenId: number,
    amount: number
): Promise<AuthResult> {
    try {
        // Verify authentication first
        const authResult = await verifyAuthentication(token);

        // If authentication failed, return the error
        if (!authResult.success) {
            return authResult;
        }

        // Check token ownership
        const walletAddress = authResult.walletAddress;
        if (!walletAddress) {
            throw new Error('Wallet address is undefined');
            // Or return an appropriate error response
        }
        const hasTokens = await hasRequiredTokens(walletAddress, tokenId, amount);

        // If token check failed, return token error
        if (!hasTokens) {
            return {
                success: false,
                walletAddress,
                error: `You need at least ${amount} of token #${tokenId}`,
                errorCode: 'TOKEN_MISSING',
            };
        }

        // Return successful access
        return {
            success: true,
            walletAddress,
        };
    } catch (error) {
        console.error('Access check failed:', error);

        return {
            success: false,
            error: 'Access check failed',
            errorCode: 'SERVER_ERROR',
        };
    }
}

/**
 * Create an authentication token for the demo wallet
 * This is for local development and demonstration purposes ONLY
 * @returns Authentication result with token for the demo wallet
 */
export async function authenticateDemoWallet(): Promise<AuthResult> {
    try {
        // Validate demo wallet configuration
        validateDemoWalletConfig();

        const walletAddress = ENV.DEMO_WALLET_ADDRESS;

        logger.debug({
            category: 'auth',
            message: `Creating auth token for demo wallet: ${walletAddress}`,
            component: 'auth',
        });

        // Generate JWT token
        const token = await createAuthToken(walletAddress, { demo: true });

        logger.info({
            category: 'auth',
            message: `Demo wallet authenticated: ${walletAddress}`,
            component: 'auth',
        });

        // Return successful authentication
        return {
            success: true,
            token,
            walletAddress,
        };
    } catch (error) {
        logger.error({
            category: 'auth',
            message: `Demo wallet authentication failed: ${error}`,
            component: 'auth',
            data: { error },
        });

        return {
            success: false,
            error: 'Demo wallet authentication failed',
            errorCode: 'SERVER_ERROR',
        };
    }
}
