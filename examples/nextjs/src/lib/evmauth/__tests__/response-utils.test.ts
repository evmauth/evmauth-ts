import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../logger';
import { createErrorResponse, createPaymentRequiredResponse } from '../response-utils';

// Mock dependencies
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((body, init) => ({
            body,
            status: init?.status || 200,
            type: 'json',
            json: () => Promise.resolve(body),
        })),
    },
}));

vi.mock('../logger', () => ({
    logger: {
        warn: vi.fn(),
    },
}));

// Environment variables are set in test-setup.ts
// No need to stub them here as they're already set in the test setup

describe('Response Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createPaymentRequiredResponse', () => {
        it('should create 402 Payment Required response with correct token details', async () => {
            const response = createPaymentRequiredResponse(1, 2);

            expect(NextResponse.json).toHaveBeenCalled();
            expect(response.status).toBe(402);

            const body = await response.json();
            expect(body.error).toBe('Payment Required');
            expect(body.details.tokenId).toBe(1);
            expect(body.details.amount).toBe(2);
            expect(body.details.contractAddress).toBe('0x1234567890123456789012345678901234567890');
            expect(body.details.networkId).toBe('1223953');
        });

        it('should default to amount of 1 if not provided', async () => {
            const response = createPaymentRequiredResponse(1);

            const body = await response.json();
            expect(body.details.amount).toBe(1);
        });

        it('should use custom message if provided', async () => {
            const customMessage = 'Custom payment required message';
            const response = createPaymentRequiredResponse(1, 1, {
                message: customMessage,
            });

            const body = await response.json();
            expect(body.message).toBe(customMessage);
        });

        it('should log the payment required response if operationId is provided', () => {
            const options = {
                operationId: 'test-operation-123',
                pathname: '/protected/premium',
                walletAddress: '0x1234567890123456789012345678901234567890',
            };

            createPaymentRequiredResponse(1, 1, options);

            expect(logger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    category: 'api',
                    component: 'response-utils',
                    operationId: options.operationId,
                    data: expect.objectContaining({
                        tokenId: 1,
                        amount: 1,
                        walletAddress: options.walletAddress,
                        pathname: options.pathname,
                    }),
                })
            );
        });
    });

    describe('createErrorResponse', () => {
        it('should create error response with default values', async () => {
            const response = createErrorResponse();

            expect(NextResponse.json).toHaveBeenCalled();
            expect(response.status).toBe(500);

            const body = await response.json();
            expect(body.error).toBe('SERVER_ERROR');
            expect(body.message).toBe('Server Error');
        });

        it('should create error response with custom values', async () => {
            const response = createErrorResponse(403, 'Forbidden', 'ACCESS_DENIED');

            expect(response.status).toBe(403);

            const body = await response.json();
            expect(body.error).toBe('ACCESS_DENIED');
            expect(body.message).toBe('Forbidden');
        });
    });
});
