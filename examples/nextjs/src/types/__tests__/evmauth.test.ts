import { describe, expect, it } from 'vitest';
import type {
    AcquisitionStep,
    AuthResult,
    AuthState,
    AuthTokenPayload,
    ChallengeResult,
    ErrorResponseBody,
    LogEntry,
    MiddlewareContext,
    MiddlewareResult,
    PurchaseOption,
    TokenMetadata,
    TokenRequirement,
    TokenValidationResult,
    WalletProvider,
} from '../evmauth';

// Type compatibility tests
describe('EVMAuth Type Definitions', () => {
    // Verify AuthTokenPayload structure
    it('should validate AuthTokenPayload structure', () => {
        const payload: AuthTokenPayload = {
            walletAddress: '0x1234567890123456789012345678901234567890',
            issuedAt: Math.floor(Date.now() / 1000),
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
            nonce: 'test-nonce',
        };

        expect(payload).toBeDefined();
        expect(payload.walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
        expect(payload.issuedAt).toBeTypeOf('number');
        expect(payload.expiresAt).toBeTypeOf('number');
        expect(payload.expiresAt).toBeGreaterThan(payload.issuedAt);
    });

    // Test using interfaces to ensure they're correctly defined
    it('should validate TokenRequirement structure', () => {
        const requirement: TokenRequirement = {
            tokenId: 0,
            amount: 1,
        };

        expect(requirement).toBeDefined();
        expect(requirement.tokenId).toBeTypeOf('number');
        expect(requirement.amount).toBeTypeOf('number');
    });

    it('should validate TokenValidationResult structure', () => {
        const validResult: TokenValidationResult = {
            isValid: true,
            walletAddress: '0x1234567890123456789012345678901234567890',
            tokenId: 0,
            requiredAmount: 1,
            actualBalance: BigInt(2),
        };

        expect(validResult).toBeDefined();
        expect(validResult.isValid).toBe(true);

        const invalidResult: TokenValidationResult = {
            isValid: false,
            walletAddress: '0x1234567890123456789012345678901234567890',
            tokenId: 0,
            requiredAmount: 1,
            actualBalance: BigInt(0),
            errorCode: 'TOKEN_INSUFFICIENT',
            message: 'Insufficient token balance',
            retryable: true,
        };

        expect(invalidResult).toBeDefined();
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errorCode).toBe('TOKEN_INSUFFICIENT');
    });

    it('should validate MiddlewareResult structure', () => {
        const response = new Response();

        const successResult: MiddlewareResult = {
            isAuthenticated: true,
            walletAddress: '0x1234567890123456789012345678901234567890',
        };

        expect(successResult).toBeDefined();
        expect(successResult.isAuthenticated).toBe(true);

        const errorResult: MiddlewareResult = {
            isAuthenticated: false,
            error: {
                code: 'AUTH_MISSING',
                message: 'Authentication required',
                status: 401,
                retryable: true,
                details: {
                    redirectUrl: '/login',
                },
            },
            response,
        };

        expect(errorResult).toBeDefined();
        expect(errorResult.isAuthenticated).toBe(false);
        expect(errorResult.error?.code).toBe('AUTH_MISSING');
        expect(errorResult.response).toBeInstanceOf(Response);
    });

    it('should validate ErrorResponseBody structure', () => {
        const errorResponse: ErrorResponseBody = {
            error: true,
            code: 'TOKEN_MISSING',
            message: 'Required token not found',
            retryable: true,
            resolution: {
                cause: 'User does not own the required token',
                steps: [
                    {
                        step: 1,
                        action: 'authenticate',
                        description: 'Connect your wallet',
                    },
                    {
                        step: 2,
                        action: 'purchase',
                        description: 'Purchase the required token',
                    },
                ],
                purchaseOptions: [
                    {
                        method: 'crypto',
                        provider: 'MetaMask',
                        url: 'https://example.com/purchase',
                    },
                ],
            },
            operationId: '123456',
        };

        expect(errorResponse).toBeDefined();
        expect(errorResponse.error).toBe(true);
        expect(errorResponse.code).toBe('TOKEN_MISSING');
        expect(errorResponse.resolution?.steps.length).toBe(2);
        expect(errorResponse.resolution?.purchaseOptions?.[0].method).toBe('crypto');
    });

    it('should validate LogEntry structure', () => {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            category: 'auth',
            message: 'User authenticated successfully',
            component: 'auth-service',
            operationId: '123456',
            data: {
                walletAddress: '0x1234567890123456789012345678901234567890',
            },
        };

        expect(logEntry).toBeDefined();
        expect(logEntry.level).toBe('info');
        expect(logEntry.category).toBe('auth');
        expect(logEntry.data?.walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should validate TokenMetadata structure', () => {
        const metadata: TokenMetadata = {
            id: 0,
            name: 'Basic Access',
            description: 'Provides basic access to the platform',
            fiatPrice: 9.99,
            timeToLive: 2592000, // 30 days in seconds
            transferable: false,
            metered: false,
            burnedOnUse: false,
        };

        expect(metadata).toBeDefined();
        expect(metadata.id).toBeTypeOf('number');
        expect(metadata.name).toBeTypeOf('string');
        expect(metadata.fiatPrice).toBeTypeOf('number');
        expect(metadata.timeToLive).toBeGreaterThan(0);
    });

    it('should validate AuthState structure', () => {
        const authState: AuthState = {
            isAuthenticated: true,
            walletAddress: '0x1234567890123456789012345678901234567890',
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
            loading: false,
        };

        expect(authState).toBeDefined();
        expect(authState.isAuthenticated).toBe(true);
        expect(authState.loading).toBe(false);

        const loadingState: AuthState = {
            isAuthenticated: false,
            loading: true,
        };

        expect(loadingState).toBeDefined();
        expect(loadingState.loading).toBe(true);
    });
});
