import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

/**
 * Mock implementation of the blockchain service
 */
export const mockBlockchainService = {
    initBlockchainService: vi.fn(),
    getEVMAuth: vi.fn(),
    getSigner: vi.fn(),
    getTokenBalance: vi.fn(),
    hasRequiredTokens: vi.fn(),
    getTokenInfo: vi.fn(),
};

/**
 * Setup blockchain service mocks with default behavior
 */
export function setupBlockchainMocks(options?: {
    tokenBalances?: Record<string, Record<number, bigint>>;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    tokenInfo?: Record<number, any>;
}) {
    const tokenBalances = options?.tokenBalances || {
        '0x1234567890123456789012345678901234567890': {
            0: BigInt(1),
            1: BigInt(0),
        },
    };

    const tokenInfo = options?.tokenInfo || {
        0: {
            id: 0,
            active: true,
            burnable: false,
            transferable: true,
            price: BigInt(1000000000000000),
            ttl: 2592000,
        },
    };

    // Mock getTokenBalance to return configured balances
    mockBlockchainService.getTokenBalance.mockImplementation(
        async (walletAddress: string, tokenId: number): Promise<bigint> => {
            if (
                tokenBalances[walletAddress] &&
                tokenBalances[walletAddress][tokenId] !== undefined
            ) {
                return tokenBalances[walletAddress][tokenId];
            }
            return BigInt(0);
        }
    );

    // Mock hasRequiredTokens based on getTokenBalance
    mockBlockchainService.hasRequiredTokens.mockImplementation(
        async (walletAddress: string, tokenId: number, amount: number): Promise<boolean> => {
            const balance = await mockBlockchainService.getTokenBalance(walletAddress, tokenId);
            return balance >= BigInt(amount);
        }
    );

    // Mock getTokenInfo to return configured token info
    mockBlockchainService.getTokenInfo.mockImplementation(async (tokenId: number) => {
        if (tokenInfo[tokenId]) {
            return tokenInfo[tokenId];
        }
        throw new Error(`Token #${tokenId} not found`);
    });

    return {
        tokenBalances,
        tokenInfo,
        reset: () => {
            vi.resetAllMocks();
            setupBlockchainMocks(options);
        },
    };
}

/**
 * MSW handlers for blockchain-related API endpoints
 */
export const blockchainHandlers = [
    // GET /api/tokens - Get token details
    http.get('/api/tokens', () => {
        return HttpResponse.json([
            {
                id: 0,
                name: 'Basic Access',
                description: 'Provides basic access to the platform',
                fiatPrice: 9.99,
                timeToLive: 2592000, // 30 days in seconds
                transferable: false,
                metered: false,
                burnedOnUse: false,
            },
            {
                id: 1,
                name: 'Premium Access',
                description: 'Provides premium access to the platform',
                fiatPrice: 29.99,
                timeToLive: 2592000, // 30 days in seconds
                transferable: false,
                metered: true,
                burnedOnUse: false,
            },
        ]);
    }),

    // GET /api/tokens/balance - Get user's token balance
    http.get('/api/tokens/balance', ({ request }) => {
        const url = new URL(request.url);
        const walletAddress = url.searchParams.get('walletAddress');
        const tokenId = url.searchParams.get('tokenId');

        if (!walletAddress) {
            return HttpResponse.json(
                { error: true, message: 'Wallet address is required' },
                { status: 400 }
            );
        }

        if (tokenId) {
            return HttpResponse.json({
                tokenId: Number.parseInt(tokenId),
                balance: tokenId === '0' ? 1 : 0,
            });
        }

        return HttpResponse.json([
            { tokenId: 0, balance: 1 },
            { tokenId: 1, balance: 0 },
        ]);
    }),
];
