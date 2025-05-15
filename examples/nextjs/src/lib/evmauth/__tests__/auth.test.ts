import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    authenticateUser,
    checkAccess,
    generateChallenge,
    verifyAuthentication,
    verifySignature,
} from '../auth';

// Mock dependencies
vi.mock('ethers', () => {
    return {
        // Use a function mock that conditionally throws
        verifyMessage: vi.fn().mockImplementation((_message, signature) => {
            if (signature === 'valid-signature') {
                return '0x1234567890123456789012345678901234567890';
            }
            throw new Error('Invalid signature');
        }),
    };
});

vi.mock('../jwt-utils', () => {
    return {
        createAuthToken: vi.fn(async (_walletAddress, _options) => {
            return 'mock-jwt-token';
        }),
        verifyAuthToken: vi.fn(async (token) => {
            if (token === 'mock-jwt-token') {
                return {
                    walletAddress: '0x1234567890123456789012345678901234567890',
                    issuedAt: Math.floor(Date.now() / 1000) - 60,
                    expiresAt: Math.floor(Date.now() / 1000) + 3600,
                };
            }
            if (token === 'expired-token') {
                return null;
            }
            return null;
        }),
    };
});

vi.mock('../blockchain', () => {
    return {
        hasRequiredTokens: vi.fn(async (_walletAddress, tokenId, _amount) => {
            // Return true for token ID 0, false for others
            return tokenId === 0;
        }),
    };
});

describe('Authentication Utilities', () => {
    // Store original environment
    const originalEnv = { ...process.env };
    const originalDateNow = Date.now;

    beforeEach(() => {
        // Set up environment variables
        vi.stubEnv('AUTH_CHALLENGE_EXPIRY', '300');

        // Reset mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore environment
        process.env = { ...originalEnv };
        vi.unstubAllEnvs();
        Date.now = originalDateNow;
    });

    describe('generateChallenge', () => {
        it('should generate a valid challenge', () => {
            const result = generateChallenge();

            expect(result.success).toBe(true);
            expect(result.challenge).toBeDefined();
            expect(result.nonce).toBeDefined();
            expect(result.expiresAt).toBeDefined();
            expect(result.challenge).toContain(result.nonce);
        });

        it('should set correct expiry time', () => {
            // Mock Date.now
            const now = 1609459200000; // 2021-01-01T00:00:00.000Z
            Date.now = vi.fn(() => now);

            const result = generateChallenge();

            if (!result.expiresAt) {
                throw new Error('expiresAt is undefined');
            }

            // Parse expiry time
            const expiryTime = new Date(result.expiresAt).getTime();

            // Should be 5 minutes in the future
            expect(expiryTime).toBe(now + 300 * 1000);
        });
    });

    describe('verifySignature', () => {
        it('should verify a valid signature', () => {
            // Generate a challenge
            const challenge = generateChallenge();

            if (!challenge.nonce) {
                throw new Error('challenge.nonce is undefined');
            }

            // Verify with valid signature
            const walletAddress = verifySignature(challenge.nonce, 'valid-signature');

            expect(walletAddress).toBe('0x1234567890123456789012345678901234567890');
        });

        it('should return null for an invalid signature', () => {
            // Generate a challenge
            const challenge = generateChallenge();

            if (!challenge.nonce) {
                throw new Error('challenge.nonce is undefined');
            }

            // Mock verifyMessage to throw for this test
            const ethers = require('ethers');
            const verifyMessageMock = vi.spyOn(ethers, 'verifyMessage').mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            try {
                // Verify with invalid signature
                const walletAddress = verifySignature(challenge.nonce, 'invalid-signature');
                expect(walletAddress).toBeNull();
            } finally {
                // Restore the mock
                verifyMessageMock.mockRestore();
            }
        });

        it('should return null for an expired challenge', () => {
            // Mock Date.now for challenge generation
            const now = 1609459200000; // 2021-01-01T00:00:00.000Z
            Date.now = vi.fn(() => now);

            // Generate a challenge
            const challenge = generateChallenge();

            if (!challenge.nonce) {
                throw new Error('challenge.nonce is undefined');
            }

            // Move time forward beyond expiration
            Date.now = vi.fn(() => now + 301 * 1000); // 5 minutes + 1 second later

            // Verify with valid signature but expired challenge
            const walletAddress = verifySignature(challenge.nonce, 'valid-signature');

            expect(walletAddress).toBeNull();
        });

        it('should return null for a non-existent nonce', () => {
            // Verify with non-existent nonce
            const walletAddress = verifySignature('non-existent-nonce', 'valid-signature');

            expect(walletAddress).toBeNull();
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate a user with valid signature', async () => {
            // Generate a challenge
            const challenge = generateChallenge();

            if (!challenge.nonce) {
                throw new Error('challenge.nonce is undefined');
            }

            // Authenticate with valid signature
            const result = await authenticateUser(challenge.nonce, 'valid-signature');

            expect(result.success).toBe(true);
            expect(result.token).toBe('mock-jwt-token');
            expect(result.walletAddress).toBe('0x1234567890123456789012345678901234567890');
        });

        it('should reject authentication with invalid signature', async () => {
            // Generate a challenge
            const challenge = generateChallenge();

            if (!challenge.nonce) {
                throw new Error('challenge.nonce is undefined');
            }

            // Authenticate with invalid signature
            const result = await authenticateUser(challenge.nonce, 'invalid-signature');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.errorCode).toBe('AUTH_INVALID');
        });

        it('should reject authentication with expired challenge', async () => {
            // Mock Date.now for challenge generation
            const now = 1609459200000; // 2021-01-01T00:00:00.000Z
            Date.now = vi.fn(() => now);

            // Generate a challenge
            const challenge = generateChallenge();

            if (!challenge.nonce) {
                throw new Error('challenge.nonce is undefined');
            }

            // Move time forward beyond expiration
            Date.now = vi.fn(() => now + 301 * 1000); // 5 minutes + 1 second later

            // Authenticate with valid signature but expired challenge
            const result = await authenticateUser(challenge.nonce, 'valid-signature');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.errorCode).toBe('AUTH_INVALID');
        });
    });

    describe('verifyAuthentication', () => {
        it('should verify a valid token', async () => {
            const result = await verifyAuthentication('mock-jwt-token');

            expect(result.success).toBe(true);
            expect(result.walletAddress).toBe('0x1234567890123456789012345678901234567890');
        });

        it('should reject an invalid token', async () => {
            const result = await verifyAuthentication('invalid-token');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.errorCode).toBe('AUTH_INVALID');
        });

        it('should reject an expired token', async () => {
            const result = await verifyAuthentication('expired-token');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.errorCode).toBe('AUTH_INVALID');
        });
    });

    describe('checkAccess', () => {
        it('should grant access with valid token and required tokens', async () => {
            const result = await checkAccess('mock-jwt-token', 0, 1);

            expect(result.success).toBe(true);
            expect(result.walletAddress).toBe('0x1234567890123456789012345678901234567890');
        });

        it('should reject access with invalid token', async () => {
            const result = await checkAccess('invalid-token', 0, 1);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.errorCode).toBe('AUTH_INVALID');
        });

        it('should reject access with valid token but missing required tokens', async () => {
            const result = await checkAccess('mock-jwt-token', 1, 1);

            expect(result.success).toBe(false);
            expect(result.walletAddress).toBe('0x1234567890123456789012345678901234567890');
            expect(result.error).toBeDefined();
            expect(result.errorCode).toBe('TOKEN_MISSING');
        });
    });
});
