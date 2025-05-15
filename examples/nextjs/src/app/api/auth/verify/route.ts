import { extractAuthToken, verifyAuthToken } from '@/lib/evmauth/jwt-utils';
import { logger } from '@/lib/evmauth/logger';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/verify - Verify authentication token
 * @param req The request object
 * @returns Verification result
 */
export async function GET(req: Request): Promise<NextResponse> {
    const operationId = nanoid();

    try {
        logger.info({
            category: 'auth',
            message: 'Token verification request',
            component: 'auth-verify-api',
            operationId,
        });

        // Extract token from request
        const token = extractAuthToken(req);

        if (!token) {
            logger.warn({
                category: 'auth',
                message: 'No token provided for verification',
                component: 'auth-verify-api',
                operationId,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'No authentication token provided',
                    errorCode: 'AUTH_MISSING',
                },
                { status: 401 }
            );
        }

        // Verify token
        const payload = await verifyAuthToken(token);

        if (!payload) {
            logger.warn({
                category: 'auth',
                message: 'Invalid or expired token',
                component: 'auth-verify-api',
                operationId,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid or expired authentication token',
                    errorCode: 'AUTH_INVALID',
                },
                { status: 401 }
            );
        }

        // Token valid, return user info
        logger.info({
            category: 'auth',
            message: 'Token verified successfully',
            component: 'auth-verify-api',
            operationId,
            data: {
                walletAddress: payload.walletAddress,
            },
        });

        return NextResponse.json({
            success: true,
            walletAddress: payload.walletAddress,
            expiresAt: payload.expiresAt,
        });
    } catch (error) {
        logger.error({
            category: 'auth',
            message: 'Error verifying token',
            component: 'auth-verify-api',
            operationId,
            data: { error: (error as Error).message },
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Error verifying authentication token',
                errorCode: 'SERVER_ERROR',
            },
            { status: 500 }
        );
    }
}
