import { authenticateDemoWallet } from '@/lib/evmauth/auth';
import { validateDemoWalletConfig } from '@/lib/evmauth/config';
import { logger } from '@/lib/evmauth/logger';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/login-demo - Log in as the demo wallet
 * @returns Authentication result with JWT token
 */
export async function GET(request: Request): Promise<NextResponse> {
    const operationId = nanoid();

    try {
        // Validate demo wallet configuration
        validateDemoWalletConfig();

        // Parse return URL from query parameter
        const url = new URL(request.url);
        const returnUrl = url.searchParams.get('returnUrl') || '/protected';

        // Authenticate demo wallet
        const authResult = await authenticateDemoWallet();

        if (!authResult.success) {
            logger.error({
                category: 'api',
                message: 'Failed to authenticate demo wallet',
                component: 'auth-demo-login-api',
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
            component: 'auth-demo-login-api',
            operationId,
            data: { walletAddress: authResult.walletAddress, returnUrl },
        });

        // Create response that redirects to the return URL
        const response = NextResponse.redirect(new URL(returnUrl, request.url));

        // Set auth token as cookie
        response.cookies.set({
            name: 'evmauth_token',
            value: authResult.token || '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        return response;
    } catch (error) {
        logger.error({
            category: 'api',
            message: 'Error authenticating demo wallet',
            component: 'auth-demo-login-api',
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
