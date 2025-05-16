import { EVMAuth } from 'evmauth';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from './lib/evmauth/logger';
import { createPaymentRequiredResponse } from './lib/evmauth/response-utils';
import { middleware } from './middleware';

// Mock dependencies
vi.mock('next/server', () => {
    const NextResponse = {
        next: vi.fn(() => ({
            type: 'next',
            headers: new Map(),
        })),
        json: vi.fn((body, init) => ({
            body,
            status: init?.status || 200,
            type: 'json',
        })),
    };

    return { NextResponse };
});

vi.mock('ethers', () => {
    return {
        ethers: {
            JsonRpcProvider: vi.fn().mockImplementation(() => ({
                // Mock provider methods
            })),
            isAddress: vi.fn((address) => {
                return address === '0x1234567890123456789012345678901234567890';
            }),
        },
    };
});

vi.mock('evmauth', () => {
    return {
        EVMAuth: vi.fn().mockImplementation(() => ({
            balanceOf: vi.fn(async (walletAddress, tokenId) => {
                // Return token balance based on wallet and token ID
                if (walletAddress === '0x1234567890123456789012345678901234567890') {
                    // Basic token (ID 0) has balance 1, premium token (ID 1) has balance 0
                    return tokenId === 0 ? 1 : 0;
                }
                return 0;
            }),
        })),
    };
});

vi.mock('./lib/evmauth/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('./lib/evmauth/response-utils', () => ({
    createPaymentRequiredResponse: vi.fn((tokenId, amount) => ({
        body: {
            error: 'Payment Required',
            details: { tokenId, amount },
        },
        status: 402,
        type: 'json',
    })),
}));

describe('EVMAuth Middleware', () => {
    // Create test requests
    const createProtectedRequest = (
        walletAddress: string,
        isApiProtected = true,
        isPremium = false
    ) => {
        const url = isApiProtected
            ? `http://localhost:3000/api/protected${isPremium ? '/premium' : ''}?address=${walletAddress || ''}`
            : `http://localhost:3000/public?address=${walletAddress || ''}`;
        return new Request(url);
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should allow access to non-protected paths', async () => {
        const request = new Request('http://localhost:3000/public');
        const response = await middleware(request);

        expect(response.type).toBe('next');
        expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should block access to protected paths without wallet address', async () => {
        const request = createProtectedRequest('');
        const response = await middleware(request);

        expect(response.status).toBe(402);
        expect(logger.warn).toHaveBeenCalled();
        expect(createPaymentRequiredResponse).toHaveBeenCalledWith(0, 1);
    });

    it('should block access to protected paths with invalid wallet address', async () => {
        const request = createProtectedRequest('invalid-address');
        const response = await middleware(request);

        expect(response.status).toBe(402);
        expect(logger.warn).toHaveBeenCalled();
        expect(createPaymentRequiredResponse).toHaveBeenCalledWith(0, 1);
    });

    it('should allow access to basic protected paths with valid wallet address and token', async () => {
        const request = createProtectedRequest('0x1234567890123456789012345678901234567890');
        const response = await middleware(request);

        expect(response.type).toBe('next');
        expect(logger.info).toHaveBeenCalled();
    });

    it('should block access to premium protected paths if user has no premium token', async () => {
        const request = createProtectedRequest(
            '0x1234567890123456789012345678901234567890',
            true,
            true
        );
        const response = await middleware(request);

        expect(response.status).toBe(402);
        expect(logger.warn).toHaveBeenCalled();
        expect(createPaymentRequiredResponse).toHaveBeenCalledWith(1, 1);
    });

    it('should handle errors gracefully', async () => {
        // Mock balanceOf to throw an error
        const mockEVMAuth = {
            balanceOf: vi.fn().mockRejectedValue(new Error('Test error')),
            // Add required EVMAuth properties to satisfy TypeScript
            contract: {},
            connect: vi.fn(),
            getContract: vi.fn(),
            DEFAULT_ADMIN_ROLE: '',
            MINTER_ROLE: '',
            PAUSER_ROLE: '',
            supportsInterface: vi.fn(),
            name: vi.fn(),
            symbol: vi.fn(),
            decimals: vi.fn(),
            totalSupply: vi.fn(),
            hasRole: vi.fn(),
            getRoleAdmin: vi.fn(),
            grantRole: vi.fn(),
            revokeRole: vi.fn(),
            renounceRole: vi.fn(),
            mint: vi.fn(),
            mintBatch: vi.fn(),
            burn: vi.fn(),
            burnBatch: vi.fn(),
            pause: vi.fn(),
            unpause: vi.fn(),
            paused: vi.fn(),
            setURI: vi.fn(),
            uri: vi.fn(),
            setContractURI: vi.fn(),
            contractURI: vi.fn(),
            setTokenURI: vi.fn(),
            tokenURI: vi.fn(),
            isApprovedForAll: vi.fn(),
            setApprovalForAll: vi.fn(),
            safeTransferFrom: vi.fn(),
            safeBatchTransferFrom: vi.fn(),
            getTokenMetadata: vi.fn(),
            balanceOfBatch: vi.fn(),
        } as unknown as EVMAuth;
        vi.mocked(EVMAuth).mockImplementationOnce(() => mockEVMAuth);

        const request = createProtectedRequest('0x1234567890123456789012345678901234567890');
        const response = await middleware(request);

        expect(response.status).toBe(undefined);
    });

    it('should pass wallet address to headers on successful validation', async () => {
        const request = createProtectedRequest('0x1234567890123456789012345678901234567890');
        await middleware(request);

        const mockNextResponse = vi.mocked(NextResponse.next).mock.results[0].value;
        expect(mockNextResponse.headers.get('x-wallet-address')).toBe(
            '0x1234567890123456789012345678901234567890'
        );
    });
});
