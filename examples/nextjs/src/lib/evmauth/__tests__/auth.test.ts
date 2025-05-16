import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkAccess } from '../auth';

// Mock dependencies
vi.mock('../blockchain', () => {
    return {
        hasRequiredTokens: vi.fn(async (_walletAddress, tokenId, _amount) => {
            // Return true for token ID 0, false for others
            return tokenId === 0;
        }),
    };
});

describe('Token Validation Utilities', () => {
    // Store original environment
    const originalEnv = { ...process.env };

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore environment
        process.env = { ...originalEnv };
        vi.unstubAllEnvs();
    });

    describe('checkAccess', () => {
        it('should grant access with valid wallet address and required tokens', async () => {
            const result = await checkAccess('0x1234567890123456789012345678901234567890', 0, 1);

            expect(result.success).toBe(true);
            expect(result.walletAddress).toBe('0x1234567890123456789012345678901234567890');
        });

        it('should reject access with missing wallet address', async () => {
            const result = await checkAccess('', 0, 1);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.errorCode).toBe('SERVER_ERROR');
        });

        it('should reject access with valid wallet address but missing required tokens', async () => {
            const result = await checkAccess('0x1234567890123456789012345678901234567890', 1, 1);

            expect(result.success).toBe(false);
            expect(result.walletAddress).toBe('0x1234567890123456789012345678901234567890');
            expect(result.error).toBeDefined();
            expect(result.errorCode).toBe('TOKEN_MISSING');
        });
    });
});
