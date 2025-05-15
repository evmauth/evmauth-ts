import { describe, expect, it, vi } from 'vitest';
import { ERROR_CODES, createErrorResponse } from '../error-utils';
import { logger } from '../logger';

// Mock dependencies
vi.mock('../logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

vi.mock('../token-utils', () => ({
    getTokenAcquisitionSteps: vi.fn(() => [
        { step: 1, action: 'authenticate', description: 'Connect your wallet' },
        { step: 2, action: 'purchase', description: 'Purchase the required token' },
    ]),
    getTokenPurchaseOptions: vi.fn(() => [
        {
            method: 'crypto',
            provider: 'MetaMask',
            url: 'https://example.com/purchase/0?method=crypto',
        },
    ]),
}));

describe('Error Utilities', () => {
    describe('createErrorResponse', () => {
        it('should create a basic error response', () => {
            const response = createErrorResponse('AUTH_MISSING');

            expect(response.error).toBe(true);
            expect(response.code).toBe('AUTH_MISSING');
            expect(response.message).toBe(ERROR_CODES.AUTH_MISSING.message);
            expect(response.retryable).toBe(ERROR_CODES.AUTH_MISSING.retryable);
        });

        it('should allow custom error message', () => {
            const customMessage = 'Custom error message';
            const response = createErrorResponse('AUTH_MISSING', { message: customMessage });

            expect(response.message).toBe(customMessage);
        });

        it('should include operation ID if provided', () => {
            const operationId = 'test-operation-123';
            const response = createErrorResponse('AUTH_MISSING', { operationId });

            expect(response.operationId).toBe(operationId);
        });

        it('should log error when operation ID is provided', () => {
            const operationId = 'test-operation-123';
            createErrorResponse('AUTH_MISSING', { operationId });

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'auth',
                    operationId,
                    component: 'error-utils',
                })
            );
        });

        it('should include resolution for token-related errors', () => {
            const response = createErrorResponse('TOKEN_MISSING', { tokenId: 0 });

            expect(response.resolution).toBeDefined();
            expect(response.resolution?.cause).toBeDefined();
            expect(response.resolution?.steps).toBeDefined();
            expect(response.resolution?.purchaseOptions).toBeDefined();
        });

        it('should not include resolution for non-token errors', () => {
            const response = createErrorResponse('SERVER_ERROR');

            expect(response.resolution).toBeUndefined();
        });

        it('should include custom details in log', () => {
            const operationId = 'test-operation-123';
            const details = { customData: 'test' };

            createErrorResponse('AUTH_MISSING', { operationId, details });

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        customData: 'test',
                    }),
                })
            );
        });

        it('should include wallet address in error log', () => {
            const operationId = 'test-operation-123';
            const walletAddress = '0x1234567890123456789012345678901234567890';

            createErrorResponse('AUTH_MISSING', { operationId, walletAddress });

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        walletAddress,
                    }),
                })
            );
        });
    });

    describe('ERROR_CODES', () => {
        it('should have expected error codes', () => {
            expect(ERROR_CODES.AUTH_MISSING).toBeDefined();
            expect(ERROR_CODES.AUTH_INVALID).toBeDefined();
            expect(ERROR_CODES.TOKEN_MISSING).toBeDefined();
            expect(ERROR_CODES.TOKEN_INSUFFICIENT).toBeDefined();
            expect(ERROR_CODES.TOKEN_EXPIRED).toBeDefined();
            expect(ERROR_CODES.CONTRACT_ERROR).toBeDefined();
            expect(ERROR_CODES.SERVER_ERROR).toBeDefined();
            expect(ERROR_CODES.INVALID_REQUEST).toBeDefined();
        });

        it('should have correct status codes', () => {
            expect(ERROR_CODES.AUTH_MISSING.status).toBe(401);
            expect(ERROR_CODES.AUTH_INVALID.status).toBe(401);
            expect(ERROR_CODES.TOKEN_MISSING.status).toBe(403);
            expect(ERROR_CODES.TOKEN_INSUFFICIENT.status).toBe(403);
            expect(ERROR_CODES.TOKEN_EXPIRED.status).toBe(403);
            expect(ERROR_CODES.CONTRACT_ERROR.status).toBe(500);
            expect(ERROR_CODES.SERVER_ERROR.status).toBe(500);
            expect(ERROR_CODES.INVALID_REQUEST.status).toBe(400);
        });

        it('should have retryable flags', () => {
            expect(ERROR_CODES.AUTH_MISSING.retryable).toBe(true);
            expect(ERROR_CODES.AUTH_INVALID.retryable).toBe(true);
            expect(ERROR_CODES.TOKEN_MISSING.retryable).toBe(true);
            expect(ERROR_CODES.TOKEN_INSUFFICIENT.retryable).toBe(true);
            expect(ERROR_CODES.TOKEN_EXPIRED.retryable).toBe(true);
            expect(ERROR_CODES.CONTRACT_ERROR.retryable).toBe(true);
            expect(ERROR_CODES.SERVER_ERROR.retryable).toBe(false);
            expect(ERROR_CODES.INVALID_REQUEST.retryable).toBe(true);
        });
    });
});
