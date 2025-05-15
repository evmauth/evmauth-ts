import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

/**
 * Mock implementation of authentication utilities
 */
export const mockAuthUtils = {
    generateChallenge: vi.fn(),
    verifySignature: vi.fn(),
    createAuthToken: vi.fn(),
    verifyAuthToken: vi.fn(),
};

/**
 * Setup authentication mocks with default behavior
 */
export function setupAuthMocks(options?: {
    validSignature?: boolean;
    validWalletAddress?: string;
}) {
    const validWalletAddress =
        options?.validWalletAddress || '0x1234567890123456789012345678901234567890';
    const validSignature = options?.validSignature ?? true;

    // Mock challenge generation
    mockAuthUtils.generateChallenge.mockImplementation(() => {
        return {
            challenge: 'Sign this message to authenticate: NONCE-123456',
            nonce: 'NONCE-123456',
        };
    });

    // Mock signature verification
    mockAuthUtils.verifySignature.mockImplementation((_challenge: string, _signature: string) => {
        if (!validSignature) return null;
        return validWalletAddress;
    });

    // Mock token creation
    mockAuthUtils.createAuthToken.mockImplementation((_walletAddress: string) => {
        return 'mock-jwt-token';
    });

    // Mock token verification
    mockAuthUtils.verifyAuthToken.mockImplementation((token: string) => {
        if (token === 'mock-jwt-token') {
            return {
                walletAddress: validWalletAddress,
                issuedAt: Math.floor(Date.now() / 1000) - 60,
                expiresAt: Math.floor(Date.now() / 1000) + 3600,
            };
        }
        return null;
    });

    return {
        validWalletAddress,
        reset: () => {
            vi.resetAllMocks();
            setupAuthMocks(options);
        },
    };
}

/**
 * MSW handlers for mocking authentication API endpoints
 */
export const authHandlers = [
    // GET /api/auth - Challenge endpoint
    http.get('/api/auth', () => {
        return HttpResponse.json({
            success: true,
            challenge: 'Sign this message to authenticate: NONCE-123456',
            nonce: 'NONCE-123456',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });
    }),

    // POST /api/auth - Verification endpoint
    http.post('/api/auth', async ({ request }) => {
        const body = (await request.json()) as { signature?: string; nonce?: string };

        if (!body || !body.signature || !body.nonce) {
            return HttpResponse.json(
                {
                    success: false,
                    error: 'Missing signature or nonce',
                },
                { status: 400 }
            );
        }

        return HttpResponse.json({
            success: true,
            token: 'mock-jwt-token',
            walletAddress: '0x1234567890123456789012345678901234567890',
        });
    }),
];
