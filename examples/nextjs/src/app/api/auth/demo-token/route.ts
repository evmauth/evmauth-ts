import { authenticateDemoWallet } from '@/lib/evmauth/auth';
import { initBlockchainService } from '@/lib/evmauth/blockchain';
import { validateDemoWalletConfig } from '@/lib/evmauth/config';
import { logger } from '@/lib/evmauth/logger';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

/**
 * Demo Auth Token API - Demo Implementation
 *
 * This API endpoint creates an authentication token for the pre-configured demo wallet.
 * It is intended for local development and demonstration purposes ONLY.
 *
 * IMPORTANT: This implementation uses a private key stored in environment variables,
 * which is NOT safe for production use. In a real application, users would connect
 * their own wallets and sign transactions themselves.
 *
 * Success response:
 * {
 *   "success": true,
 *   "token": string, // The JWT token
 *   "walletAddress": string // The demo wallet address
 * }
 *
 * Error response:
 * {
 *   "success": false,
 *   "error": string, // Error message
 *   "errorCode": string // Error code for programmatic handling
 * }
 */

/**
 * GET /api/auth/demo-token - Get an authentication token for the demo wallet
 * @returns Demo wallet authentication result
 */
export async function GET(): Promise<NextResponse> {
    const operationId = nanoid();

    try {
        // Initialize blockchain service on every request to ensure latest environment variables
        try {
            // Initialize blockchain service with latest environment variables
            await initBlockchainService();
        } catch (error) {
            logger.error({
                category: 'api',
                message: 'Error during EVMAuth initialization',
                component: 'auth-demo-token-api',
                operationId,
                data: { error: (error as Error).message },
            });
        }

        // Validate demo wallet configuration
        validateDemoWalletConfig();

        // Authenticate demo wallet
        const authResult = await authenticateDemoWallet();

        if (!authResult.success) {
            logger.error({
                category: 'api',
                message: 'Failed to authenticate demo wallet',
                component: 'auth-demo-token-api',
                operationId,
                data: { error: authResult.error },
            });

            return NextResponse.json(
                {
                    success: false,
                    error: authResult.error,
                    errorCode: authResult.errorCode,
                },
                { status: 500 }
            );
        }

        logger.info({
            category: 'api',
            message: 'Demo wallet authenticated successfully',
            component: 'auth-demo-token-api',
            operationId,
            data: { walletAddress: authResult.walletAddress },
        });

        // Set cookie
        const response = NextResponse.json(authResult);

        // Set auth token as cookie
        if (authResult.token) {
            response.cookies.set({
                name: 'evmauth_token',
                value: authResult.token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
            });
        }

        return response;
    } catch (error) {
        logger.error({
            category: 'api',
            message: 'Error authenticating demo wallet',
            component: 'auth-demo-token-api',
            operationId,
            data: { error: (error as Error).message },
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Error authenticating demo wallet',
                errorCode: 'SERVER_ERROR',
            },
            { status: 500 }
        );
    }
}
