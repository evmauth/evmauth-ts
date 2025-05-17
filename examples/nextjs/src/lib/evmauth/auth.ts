import type { AuthResult } from '@/types/evmauth';
import { hasRequiredTokens } from './blockchain';
import { logger } from './logger';

/**
 * Check if a user has access to a resource based on their wallet address
 * @param walletAddress The wallet address to check
 * @param tokenId The token ID required for access
 * @param amount The amount of tokens required
 * @returns The authentication result with token verification
 */
export async function checkAccess(
    walletAddress: string,
    tokenId: number,
    amount: number
): Promise<AuthResult> {
    try {
        // Check token ownership
        if (!walletAddress) {
            throw new Error('Wallet address is undefined');
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
        logger.error({
            category: 'auth',
            message: `Access check failed: ${error}`,
            component: 'auth',
            data: { error },
        });

        return {
            success: false,
            error: 'Access check failed',
            errorCode: 'SERVER_ERROR',
        };
    }
}
