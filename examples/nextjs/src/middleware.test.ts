import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './lib/evmauth/logger';
import {
    createMiddlewareContext,
    createMiddlewareResponse,
    processAuth,
    shouldExcludePath,
} from './lib/evmauth/middleware-helpers';
import { middleware } from './middleware';

// Mock dependencies
vi.mock('next/server', () => {
    const NextResponse = {
        next: vi.fn(() => ({ type: 'next' })),
        redirect: vi.fn((url) => ({ url: url.toString(), type: 'redirect' })),
    };

    // NextRequest is just Request in Node environment
    class NextRequest extends Request {}

    return { NextResponse, NextRequest };
});

vi.mock('./lib/evmauth/middleware-helpers', () => ({
    createMiddlewareContext: vi.fn(),
    shouldExcludePath: vi.fn(),
    processAuth: vi.fn(),
    createMiddlewareResponse: vi.fn(),
}));

vi.mock('./lib/evmauth/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('./lib/evmauth/config', () => ({
    validateConfig: vi.fn(() => ({ isValid: true, errors: [] })),
}));

vi.mock('./lib/evmauth/blockchain', () => ({
    initBlockchainService: vi.fn().mockResolvedValue(undefined),
}));

describe('EVMAuth Middleware', () => {
    // Create test request
    const createTestRequest = () => {
        return new NextRequest('http://localhost:3000/protected');
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Set up mock returns
        vi.mocked(createMiddlewareContext).mockReturnValue({
            req: createTestRequest(),
            url: new URL('http://localhost:3000/protected'),
            pathname: '/protected',
            isApiRoute: false,
            isProtectedPath: true,
            tokenRequirement: { tokenId: 0, amount: 1 },
            operationId: 'test-operation-id',
        });

        vi.mocked(shouldExcludePath).mockReturnValue(false);

        vi.mocked(processAuth).mockResolvedValue({
            isAuthenticated: true,
            walletAddress: '0x1234567890123456789012345678901234567890',
        });

        vi.mocked(createMiddlewareResponse).mockReturnValue({
            type: 'next',
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } as any);
    });

    it('should create middleware context', async () => {
        const request = createTestRequest();
        await middleware(request);

        expect(createMiddlewareContext).toHaveBeenCalledWith(request);
    });

    it('should skip middleware for excluded paths', async () => {
        vi.mocked(shouldExcludePath).mockReturnValue(true);

        const request = createTestRequest();
        await middleware(request);

        expect(logger.debug).toHaveBeenCalled();
        expect(processAuth).not.toHaveBeenCalled();
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should process authentication for non-excluded paths', async () => {
        const request = createTestRequest();
        await middleware(request);

        expect(processAuth).toHaveBeenCalledWith(
            expect.objectContaining({
                pathname: '/protected',
                isProtectedPath: true,
            })
        );
    });

    it('should create response based on auth result', async () => {
        const request = createTestRequest();
        const authResult = {
            isAuthenticated: true,
            walletAddress: '0x1234567890123456789012345678901234567890',
        };

        vi.mocked(processAuth).mockResolvedValue(authResult);

        await middleware(request);

        expect(createMiddlewareResponse).toHaveBeenCalledWith(authResult, request);
    });

    it('should handle errors gracefully', async () => {
        vi.mocked(processAuth).mockRejectedValue(new Error('Test error'));

        const request = createTestRequest();
        const response = await middleware(request);

        expect(response.type).toBe('redirect');
        expect(response.url).toContain('SERVER_ERROR');
    });
});
