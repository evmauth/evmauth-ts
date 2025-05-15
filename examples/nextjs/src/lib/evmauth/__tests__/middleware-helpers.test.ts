import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTokenRequirementForPath, isAuthPath, isProtectedPath, isStaticPath } from '../config';
import { extractAuthToken, verifyAuthToken } from '../jwt-utils';
import { logger } from '../logger';
import {
    createMiddlewareContext,
    createMiddlewareResponse,
    processAuth,
    shouldExcludePath,
} from '../middleware-helpers';
import { createApiErrorResponse, createPageErrorRedirect } from '../response-utils';
import { validateToken } from '../token-validator';

// Mock dependencies
vi.mock('next/server', () => ({
    NextResponse: {
        next: vi.fn(() => ({
            headers: new Map(),
            type: 'next',
        })),
        redirect: vi.fn((url) => ({
            url: url.toString(),
            status: 302,
            type: 'redirect',
        })),
    },
}));

vi.mock('nanoid', () => ({
    nanoid: vi.fn(() => 'test-operation-id'),
}));

vi.mock('../jwt-utils', () => ({
    extractAuthToken: vi.fn(),
    verifyAuthToken: vi.fn(),
}));

vi.mock('../config', () => ({
    isProtectedPath: vi.fn(),
    isAuthPath: vi.fn(),
    isStaticPath: vi.fn(),
    getTokenRequirementForPath: vi.fn(),
}));

vi.mock('../token-validator', () => ({
    validateToken: vi.fn(),
}));

vi.mock('../response-utils', () => ({
    createApiErrorResponse: vi.fn((errorCode, _options) => ({
        body: { error: true, code: errorCode },
        status: 401,
        type: 'api-error',
    })),
    createPageErrorRedirect: vi.fn((errorCode, _options) => ({
        url: `/error?code=${errorCode}`,
        status: 302,
        type: 'page-error',
    })),
}));

vi.mock('../logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('Middleware Helpers', () => {
    // Test data
    const testRequest = new Request('http://localhost:3000/protected');
    const validToken = 'valid-jwt-token';
    const validWalletAddress = '0x1234567890123456789012345678901234567890';

    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock implementations
        vi.mocked(isProtectedPath).mockReturnValue(true);
        vi.mocked(isAuthPath).mockReturnValue(false);
        vi.mocked(isStaticPath).mockReturnValue(false);
        vi.mocked(getTokenRequirementForPath).mockReturnValue({ tokenId: 0, amount: 1 });

        vi.mocked(extractAuthToken).mockReturnValue(validToken);
        vi.mocked(verifyAuthToken).mockResolvedValue({
            walletAddress: validWalletAddress,
            issuedAt: Math.floor(Date.now() / 1000) - 60,
            expiresAt: Math.floor(Date.now() / 1000) + 3600,
        });

        vi.mocked(validateToken).mockResolvedValue({
            isValid: true,
            walletAddress: validWalletAddress,
            tokenId: 0,
            requiredAmount: 1,
            actualBalance: BigInt(1),
        });
    });

    describe('createMiddlewareContext', () => {
        it('should create a context from a request', () => {
            // Mock isProtectedPath
            vi.mocked(isProtectedPath).mockReturnValue(true);

            const context = createMiddlewareContext(testRequest);

            expect(context.req).toBe(testRequest);
            expect(context.pathname).toBe('/protected');
            expect(context.isApiRoute).toBe(false);
            expect(context.isProtectedPath).toBe(true);
            expect(context.tokenRequirement).toEqual({ tokenId: 0, amount: 1 });
            expect(context.operationId).toBe('test-operation-id');
        });

        it('should identify API routes', () => {
            const apiRequest = new Request('http://localhost:3000/api/protected');
            const context = createMiddlewareContext(apiRequest);

            expect(context.isApiRoute).toBe(true);
        });

        it('should handle non-protected paths', () => {
            // Mock isProtectedPath
            vi.mocked(isProtectedPath).mockReturnValue(false);

            const publicRequest = new Request('http://localhost:3000/public');
            const context = createMiddlewareContext(publicRequest);

            expect(context.isProtectedPath).toBe(false);
            expect(context.tokenRequirement).toBeUndefined();
        });

        it('should log middleware request', () => {
            createMiddlewareContext(testRequest);

            expect(logger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'middleware',
                    component: 'middleware-helpers',
                    operationId: 'test-operation-id',
                })
            );
        });
    });

    describe('shouldExcludePath', () => {
        it('should exclude static paths', () => {
            vi.mocked(isStaticPath).mockReturnValue(true);
            vi.mocked(isAuthPath).mockReturnValue(false);

            expect(shouldExcludePath('/static/file.js')).toBe(true);
        });

        it('should exclude auth paths', () => {
            vi.mocked(isStaticPath).mockReturnValue(false);
            vi.mocked(isAuthPath).mockReturnValue(true);

            expect(shouldExcludePath('/api/auth')).toBe(true);
        });

        it('should not exclude normal paths', () => {
            vi.mocked(isStaticPath).mockReturnValue(false);
            vi.mocked(isAuthPath).mockReturnValue(false);

            expect(shouldExcludePath('/protected')).toBe(false);
        });
    });

    describe('processAuth', () => {
        it('should skip auth for non-protected paths', async () => {
            const context = {
                req: testRequest,
                url: new URL(testRequest.url),
                pathname: '/public',
                isApiRoute: false,
                isProtectedPath: false,
                operationId: 'test-operation-id',
            };

            const result = await processAuth(context);

            expect(result.isAuthenticated).toBe(true);
            expect(extractAuthToken).not.toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalled();
        });

        it('should return unauthorized if no token is present', async () => {
            vi.mocked(extractAuthToken).mockReturnValue(null);

            const context = {
                req: testRequest,
                url: new URL(testRequest.url),
                pathname: '/protected',
                isApiRoute: false,
                isProtectedPath: true,
                tokenRequirement: { tokenId: 0, amount: 1 },
                operationId: 'test-operation-id',
            };

            const result = await processAuth(context);

            expect(result.isAuthenticated).toBe(false);
            expect(result.error?.code).toBe('AUTH_MISSING');
            expect(result.response).toBeDefined();
            expect(createPageErrorRedirect).toHaveBeenCalledWith(
                'AUTH_MISSING',
                expect.any(Object)
            );
            expect(logger.warn).toHaveBeenCalled();
        });

        it('should return API error for API routes with no token', async () => {
            vi.mocked(extractAuthToken).mockReturnValue(null);

            const context = {
                req: testRequest,
                url: new URL(testRequest.url),
                pathname: '/api/protected',
                isApiRoute: true,
                isProtectedPath: true,
                tokenRequirement: { tokenId: 0, amount: 1 },
                operationId: 'test-operation-id',
            };

            const result = await processAuth(context);

            expect(result.isAuthenticated).toBe(false);
            expect(result.response).toBeDefined();
            expect(createApiErrorResponse).toHaveBeenCalledWith('AUTH_MISSING', expect.any(Object));
        });

        it('should return unauthorized if token is invalid', async () => {
            vi.mocked(verifyAuthToken).mockResolvedValue(null);

            const context = {
                req: testRequest,
                url: new URL(testRequest.url),
                pathname: '/protected',
                isApiRoute: false,
                isProtectedPath: true,
                tokenRequirement: { tokenId: 0, amount: 1 },
                operationId: 'test-operation-id',
            };

            const result = await processAuth(context);

            expect(result.isAuthenticated).toBe(false);
            expect(result.error?.code).toBe('AUTH_INVALID');
            expect(result.response).toBeDefined();
            expect(createPageErrorRedirect).toHaveBeenCalledWith(
                'AUTH_INVALID',
                expect.any(Object)
            );
        });

        it('should validate token requirement if path requires tokens', async () => {
            const context = {
                req: testRequest,
                url: new URL(testRequest.url),
                pathname: '/protected',
                isApiRoute: false,
                isProtectedPath: true,
                tokenRequirement: { tokenId: 0, amount: 1 },
                operationId: 'test-operation-id',
            };

            const result = await processAuth(context);

            expect(result.isAuthenticated).toBe(true);
            expect(result.walletAddress).toBe(validWalletAddress);
            expect(validateToken).toHaveBeenCalledWith(
                validWalletAddress,
                { tokenId: 0, amount: 1 },
                'test-operation-id'
            );
        });

        it('should return forbidden if token validation fails', async () => {
            vi.mocked(validateToken).mockResolvedValue({
                isValid: false,
                walletAddress: validWalletAddress,
                tokenId: 0,
                requiredAmount: 1,
                actualBalance: BigInt(0),
                errorCode: 'TOKEN_MISSING',
                message: 'You need at least 1 of token #0',
                retryable: true,
            });

            const context = {
                req: testRequest,
                url: new URL(testRequest.url),
                pathname: '/protected',
                isApiRoute: false,
                isProtectedPath: true,
                tokenRequirement: { tokenId: 0, amount: 1 },
                operationId: 'test-operation-id',
            };

            const result = await processAuth(context);

            expect(result.isAuthenticated).toBe(false);
            expect(result.walletAddress).toBe(validWalletAddress);
            expect(result.error?.code).toBe('TOKEN_MISSING');
            expect(result.response).toBeDefined();
            expect(createPageErrorRedirect).toHaveBeenCalledWith(
                'TOKEN_MISSING',
                expect.any(Object)
            );
        });

        it('should return API error for API routes with token validation failure', async () => {
            vi.mocked(validateToken).mockResolvedValue({
                isValid: false,
                walletAddress: validWalletAddress,
                tokenId: 0,
                requiredAmount: 1,
                actualBalance: BigInt(0),
                errorCode: 'TOKEN_MISSING',
                message: 'You need at least 1 of token #0',
                retryable: true,
            });

            const context = {
                req: testRequest,
                url: new URL(testRequest.url),
                pathname: '/api/protected',
                isApiRoute: true,
                isProtectedPath: true,
                tokenRequirement: { tokenId: 0, amount: 1 },
                operationId: 'test-operation-id',
            };

            const result = await processAuth(context);

            expect(result.isAuthenticated).toBe(false);
            expect(createApiErrorResponse).toHaveBeenCalledWith(
                'TOKEN_MISSING',
                expect.any(Object)
            );
        });

        it('should log success when authentication and validation pass', async () => {
            const context = {
                req: testRequest,
                url: new URL(testRequest.url),
                pathname: '/protected',
                isApiRoute: false,
                isProtectedPath: true,
                tokenRequirement: { tokenId: 0, amount: 1 },
                operationId: 'test-operation-id',
            };

            const result = await processAuth(context);

            expect(result.isAuthenticated).toBe(true);
            expect(logger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'middleware',
                    message: expect.stringContaining('Auth successful'),
                })
            );
        });
    });

    describe('createMiddlewareResponse', () => {
        it('should return existing response if provided', () => {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            const customResponse = { url: '/custom', status: 302, type: 'custom' } as any;
            const result = {
                isAuthenticated: false,
                response: customResponse,
            };

            const response = createMiddlewareResponse(result, testRequest);

            expect(response).toBe(customResponse);
        });

        it('should return next response with wallet address for authenticated requests', () => {
            const result = {
                isAuthenticated: true,
                walletAddress: validWalletAddress,
            };

            const response = createMiddlewareResponse(result, testRequest);

            expect(response.type).toBe('next');
            expect(response.headers.get('x-wallet-address')).toBe(validWalletAddress);
            expect(NextResponse.next).toHaveBeenCalled();
        });

        it('should return next response without wallet address if not available', () => {
            const result = {
                isAuthenticated: true,
            };

            // Mock the NextResponse.next to return a response with headers
            const mockResponse = {
                // Use any string as a type - it will be checked with toBe, not with type safety
                type: 'next',
                headers: {
                    get: vi.fn(),
                    set: vi.fn(),
                    append: vi.fn(),
                    delete: vi.fn(),
                    has: vi.fn(),
                    getSetCookie: vi.fn().mockReturnValue([]),
                    forEach: vi.fn(),
                    entries: vi.fn(),
                    keys: vi.fn(),
                    values: vi.fn(),
                },
            } as unknown as NextResponse;

            vi.mocked(NextResponse.next).mockReturnValueOnce(mockResponse);

            const response = createMiddlewareResponse(result, testRequest);

            expect(response.type).toBe('next');
            expect(response.headers.get('x-wallet-address')).toBeUndefined();
        });

        it('should redirect to login for unauthenticated requests', () => {
            const result = {
                isAuthenticated: false,
                error: {
                    code: 'AUTH_MISSING',
                    message: 'Authentication required',
                    status: 401,
                    retryable: true,
                },
            };

            const response = createMiddlewareResponse(result, testRequest);

            expect(response.type).toBe('redirect');
            expect(response.url).toContain('/login');
            expect(NextResponse.redirect).toHaveBeenCalled();
        });
    });
});
