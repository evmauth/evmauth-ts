import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTokenRequirementForPath } from '../config';
import { createErrorResponse } from '../error-utils';
import { logger } from '../logger';
import { createApiErrorResponse, createPageErrorRedirect } from '../response-utils';

// Mock dependencies
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({
            body,
            status: init?.status || 200,
            type: 'json',
            json: () => Promise.resolve(body),
        })),
        redirect: vi.fn((url) => ({
            url: url.toString(),
            status: 302,
            type: 'redirect',
        })),
    },
}));

vi.mock('../error-utils', () => ({
    createErrorResponse: vi.fn((errorCode, options) => ({
        error: true,
        code: errorCode,
        message: options?.message || `Error message for ${errorCode}`,
        retryable: true,
        operationId: options?.operationId,
    })),
    ERROR_CODES: {
        AUTH_MISSING: { status: 401, retryable: true },
        AUTH_INVALID: { status: 401, retryable: true },
        TOKEN_MISSING: { status: 403, retryable: true },
        TOKEN_INSUFFICIENT: { status: 403, retryable: true },
        TOKEN_EXPIRED: { status: 403, retryable: true },
        CONTRACT_ERROR: { status: 500, retryable: true },
        SERVER_ERROR: { status: 500, retryable: false },
    },
}));

vi.mock('../logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

vi.mock('../config', () => ({
    getTokenRequirementForPath: vi.fn((pathname) => ({
        tokenId: pathname.includes('premium') ? 1 : 0,
        amount: 1,
    })),
}));

describe('Response Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createApiErrorResponse', () => {
        it('should create API error response with correct status code', async () => {
            const response = createApiErrorResponse('AUTH_MISSING');

            expect(NextResponse.json).toHaveBeenCalled();
            expect(response.status).toBe(401);

            const body = await response.json();
            expect(body.error).toBe(true);
            expect(body.code).toBe('AUTH_MISSING');
        });

        it('should use error response from createErrorResponse', () => {
            const options = {
                message: 'Custom error message',
                operationId: 'test-operation-123',
                walletAddress: '0x1234567890123456789012345678901234567890',
            };

            createApiErrorResponse('AUTH_MISSING', options);

            expect(createErrorResponse).toHaveBeenCalledWith(
                'AUTH_MISSING',
                expect.objectContaining({
                    message: options.message,
                    operationId: options.operationId,
                    walletAddress: options.walletAddress,
                })
            );
        });

        it('should get token ID from pathname if provided', () => {
            const options = {
                pathname: '/protected',
                operationId: 'test-operation-123',
            };

            createApiErrorResponse('TOKEN_MISSING', options);

            expect(getTokenRequirementForPath).toHaveBeenCalledWith('/protected');
            expect(createErrorResponse).toHaveBeenCalledWith(
                'TOKEN_MISSING',
                expect.objectContaining({
                    tokenId: 0,
                })
            );
        });

        it('should log error if operation ID is provided', () => {
            const options = {
                operationId: 'test-operation-123',
                pathname: '/protected',
            };

            createApiErrorResponse('AUTH_MISSING', options);

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'api',
                    operationId: options.operationId,
                    component: 'response-utils',
                    data: expect.objectContaining({
                        errorCode: 'AUTH_MISSING',
                        pathname: '/protected',
                    }),
                })
            );
        });

        it('should include custom details in log', () => {
            const options = {
                operationId: 'test-operation-123',
                details: { customData: 'test' },
            };

            createApiErrorResponse('AUTH_MISSING', options);

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        customData: 'test',
                    }),
                })
            );
        });
    });

    describe('createPageErrorRedirect', () => {
        it('should redirect to login for auth errors', () => {
            const response = createPageErrorRedirect('AUTH_MISSING');

            expect(NextResponse.redirect).toHaveBeenCalled();
            expect(response.url).toContain('/login');
            expect(response.status).toBe(302);
        });

        it('should redirect to token-required for token errors', () => {
            const response = createPageErrorRedirect('TOKEN_MISSING', {
                pathname: '/protected',
            });

            expect(NextResponse.redirect).toHaveBeenCalled();
            expect(response.url).toContain('/token-required');
            expect(response.url).toContain('tokenId=0');
            expect(response.url).toContain('error=TOKEN_MISSING');
            expect(response.status).toBe(302);
        });

        it('should redirect to error page for server errors', () => {
            const response = createPageErrorRedirect('SERVER_ERROR');

            expect(NextResponse.redirect).toHaveBeenCalled();
            expect(response.url).toContain('/error');
            expect(response.url).toContain('code=SERVER_ERROR');
            expect(response.status).toBe(302);
        });

        it('should include custom message in redirect URL', () => {
            const message = 'Custom error message';
            const response = createPageErrorRedirect('SERVER_ERROR', { message });

            expect(response.url).toContain(`message=${encodeURIComponent(message)}`);
        });

        it('should include return URL if pathname provided', () => {
            const pathname = '/protected/resource';
            const response = createPageErrorRedirect('AUTH_MISSING', { pathname });

            expect(response.url).toContain(`returnUrl=${encodeURIComponent(pathname)}`);
        });

        it('should get token ID from pathname if provided', () => {
            const pathname = '/protected/premium';
            const response = createPageErrorRedirect('TOKEN_MISSING', { pathname });

            expect(getTokenRequirementForPath).toHaveBeenCalledWith(pathname);
            expect(response.url).toContain('tokenId=1');
        });

        it('should log error if operation ID is provided', () => {
            const options = {
                operationId: 'test-operation-123',
                pathname: '/protected',
            };

            createPageErrorRedirect('AUTH_MISSING', options);

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'middleware',
                    operationId: options.operationId,
                    component: 'response-utils',
                    data: expect.objectContaining({
                        errorCode: 'AUTH_MISSING',
                        pathname: '/protected',
                    }),
                })
            );
        });
    });
});
