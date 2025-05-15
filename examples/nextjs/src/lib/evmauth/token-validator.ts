import type { TokenRequirement, TokenValidationResult } from '@/types/evmauth';
import { demoWalletHasRequiredTokens, validateTokenRequirement } from './blockchain';
import { ENV } from './config';
import { logger } from './logger';

/**
 * Validate a token requirement for a wallet address
 * @param walletAddress The wallet address to validate
 * @param tokenRequirement The token requirement to validate
 * @param operationId Optional operation ID for logging
 * @returns A validation result
 */
export async function validateToken(
    walletAddress: string,
    tokenRequirement: TokenRequirement,
    operationId?: string
): Promise<TokenValidationResult> {
    try {
        // Log validation attempt
        if (operationId) {
            logger.info({
                category: 'token',
                message: `Validating token requirement for ${walletAddress}`,
                component: 'token-validator',
                operationId,
                data: {
                    walletAddress,
                    tokenRequirement,
                },
            });
        }

        // Check wallet address format first
        if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            const result: TokenValidationResult = {
                isValid: false,
                walletAddress,
                tokenId: tokenRequirement.tokenId,
                requiredAmount: tokenRequirement.amount,
                errorCode: 'AUTH_INVALID',
                message: 'Invalid wallet address format',
                retryable: true,
            };

            // Log validation failure
            if (operationId) {
                logger.warn({
                    category: 'token',
                    message: `Token validation failed: ${result.message}`,
                    component: 'token-validator',
                    operationId,
                    data: {
                        walletAddress,
                        tokenRequirement,
                        errorCode: result.errorCode,
                    },
                });
            }

            return result;
        }

        // Check for demo wallet
        if (walletAddress === ENV.DEMO_WALLET_ADDRESS) {
            // For demo wallet, check demo wallet token ownership using local function
            const hasToken = await demoWalletHasRequiredTokens(
                tokenRequirement.tokenId,
                tokenRequirement.amount
            );

            if (hasToken) {
                logger.info({
                    category: 'token',
                    message: `Demo wallet token validation succeeded for token ${tokenRequirement.tokenId}`,
                    component: 'token-validator',
                    operationId: operationId || 'no-op-id',
                    data: { walletAddress, tokenRequirement },
                });

                return {
                    isValid: true,
                    walletAddress,
                    tokenId: tokenRequirement.tokenId,
                    requiredAmount: tokenRequirement.amount,
                    actualBalance: BigInt(1),
                };
            }
        }

        // Get validation result for regular validation
        const result = await validateTokenRequirement(
            walletAddress,
            tokenRequirement.tokenId,
            tokenRequirement.amount
        );

        // Log validation result
        if (operationId) {
            if (result.isValid) {
                logger.info({
                    category: 'token',
                    message: `Token validation succeeded for ${walletAddress}`,
                    component: 'token-validator',
                    operationId,
                    data: {
                        walletAddress,
                        tokenRequirement,
                        balance: result.actualBalance?.toString(),
                    },
                });
            } else {
                logger.warn({
                    category: 'token',
                    message: `Token validation failed: ${result.message}`,
                    component: 'token-validator',
                    operationId,
                    data: {
                        walletAddress,
                        tokenRequirement,
                        errorCode: result.errorCode,
                        balance: result.actualBalance?.toString(),
                    },
                });
            }
        }

        return result;
    } catch (error) {
        // Log validation error
        if (operationId) {
            logger.error({
                category: 'token',
                message: `Token validation error: ${(error as Error).message}`,
                component: 'token-validator',
                operationId,
                data: {
                    walletAddress,
                    tokenRequirement,
                    error: (error as Error).stack,
                },
            });
        }

        // Return error result
        return {
            isValid: false,
            walletAddress,
            tokenId: tokenRequirement.tokenId,
            requiredAmount: tokenRequirement.amount,
            errorCode: 'CONTRACT_ERROR',
            message: 'Error validating token requirement',
            retryable: true,
        };
    }
}
