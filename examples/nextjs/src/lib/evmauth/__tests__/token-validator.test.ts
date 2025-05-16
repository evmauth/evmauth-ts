import type { TokenRequirement } from '@/types/evmauth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateTokenRequirement } from '../blockchain';
import { logger } from '../logger';
import { validateToken } from '../token-validator';

// Mock dependencies
vi.mock('../blockchain', () => ({
    validateTokenRequirement: vi.fn(),
}));

vi.mock('../logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Token Validator', () => {
    // Test data
    const validWalletAddress = '0x1234567890123456789012345678901234567890';
    const invalidWalletAddress = 'not-a-wallet';
    const tokenRequirement: TokenRequirement = { tokenId: 0, amount: 1 };
    const operationId = 'test-operation-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateToken', () => {
        it('should validate a token requirement successfully', async () => {
            // Mock successful validation
            vi.mocked(validateTokenRequirement).mockResolvedValueOnce({
                isValid: true,
                walletAddress: validWalletAddress,
                tokenId: 0,
                requiredAmount: 1,
                actualBalance: BigInt(1),
            });

            const result = await validateToken(validWalletAddress, tokenRequirement, operationId);

            expect(result.isValid).toBe(true);
            expect(result.walletAddress).toBe(validWalletAddress);
            expect(result.tokenId).toBe(0);
            expect(result.requiredAmount).toBe(1);
            expect(result.actualBalance).toBe(BigInt(1));

            // Check logger
            expect(logger.info).toHaveBeenCalledTimes(2);
            expect(validateTokenRequirement).toHaveBeenCalledWith(
                validWalletAddress,
                tokenRequirement.tokenId,
                tokenRequirement.amount
            );
        });

        it('should reject invalid wallet address format', async () => {
            const result = await validateToken(invalidWalletAddress, tokenRequirement, operationId);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe('AUTH_INVALID');
            expect(result.walletAddress).toBe(invalidWalletAddress);
            expect(result.tokenId).toBe(0);
            expect(result.requiredAmount).toBe(1);

            // Check logger
            expect(logger.warn).toHaveBeenCalledTimes(1);
            expect(validateTokenRequirement).not.toHaveBeenCalled();
        });

        it('should handle token requirement failure', async () => {
            // Mock failed validation
            vi.mocked(validateTokenRequirement).mockResolvedValueOnce({
                isValid: false,
                walletAddress: validWalletAddress,
                tokenId: 0,
                requiredAmount: 1,
                actualBalance: BigInt(0),
                errorCode: 'TOKEN_MISSING',
                message: 'You need at least 1 of token #0',
                retryable: true,
            });

            const result = await validateToken(validWalletAddress, tokenRequirement, operationId);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe('TOKEN_MISSING');
            expect(result.message).toBe('You need at least 1 of token #0');
            expect(result.walletAddress).toBe(validWalletAddress);

            // Check logger
            expect(logger.info).toHaveBeenCalledTimes(1);
            expect(logger.warn).toHaveBeenCalledTimes(1);
        });

        it('should handle validation errors', async () => {
            // Mock validation error
            vi.mocked(validateTokenRequirement).mockRejectedValueOnce(
                new Error('Connection error')
            );

            const result = await validateToken(validWalletAddress, tokenRequirement, operationId);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe('CONTRACT_ERROR');
            expect(result.walletAddress).toBe(validWalletAddress);

            // Check logger
            expect(logger.error).toHaveBeenCalledTimes(1);
        });

        it('should not log if operation ID is not provided', async () => {
            // Mock successful validation
            vi.mocked(validateTokenRequirement).mockResolvedValueOnce({
                isValid: true,
                walletAddress: validWalletAddress,
                tokenId: 0,
                requiredAmount: 1,
                actualBalance: BigInt(1),
            });

            const result = await validateToken(validWalletAddress, tokenRequirement);

            expect(result.isValid).toBe(true);

            // Check logger not called
            expect(logger.info).not.toHaveBeenCalled();
        });
    });
});
