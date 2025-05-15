import { ENV } from '@/lib/evmauth/config';
import { extractAuthToken, verifyAuthToken } from '@/lib/evmauth/jwt-utils';
import { logger } from '@/lib/evmauth/logger';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/status - Check the current authentication status
 * @param request The request object
 * @returns The authentication status
 */
export async function GET(request: Request): Promise<NextResponse> {
    const operationId = nanoid();

    try {
        // Debug information
        const cookies = request.headers.get('Cookie') || '';
        const hasCookie = cookies.includes('evmauth_token') || cookies.includes('authToken');

        // Auth token extraction
        const authToken = extractAuthToken(request);
        let tokenPayload = null;

        // Verify token if present
        if (authToken) {
            tokenPayload = await verifyAuthToken(authToken);
        }

        // Demo wallet info
        const demoWalletAddress = ENV.DEMO_WALLET_ADDRESS;

        logger.info({
            category: 'api',
            message: 'Authentication status check',
            component: 'auth-status-api',
            operationId,
            data: {
                hasCookie,
                hasToken: !!authToken,
                isValidToken: !!tokenPayload,
            },
        });

        return NextResponse.json({
            success: true,
            authenticated: !!tokenPayload,
            demoWallet: demoWalletAddress,
            walletAddress: tokenPayload?.walletAddress || null,
            debugInfo: {
                hasCookie,
                cookies,
                hasAuthToken: !!authToken,
                tokenValid: !!tokenPayload,
                tokenExpiry: tokenPayload
                    ? new Date(tokenPayload.expiresAt * 1000).toISOString()
                    : null,
            },
        });
    } catch (error) {
        logger.error({
            category: 'api',
            message: 'Error checking authentication status',
            component: 'auth-status-api',
            operationId,
            data: { error },
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Error checking authentication status',
            },
            { status: 500 }
        );
    }
}
