import { NextResponse } from 'next/server';

/**
 * GET /api/protected/premium - Premium protected API endpoint
 *
 * This endpoint requires the premium token (token ID 1)
 * as configured in the TOKEN_REQUIREMENTS in src/lib/evmauth/config.ts
 *
 * @returns Premium protected data
 */
export async function GET(req: Request): Promise<NextResponse> {
    // Get wallet address from request header (set by middleware)
    const walletAddress = req.headers.get('x-wallet-address');

    return NextResponse.json({
        success: true,
        message: 'This is premium protected data that requires token ID 1',
        walletAddress,
        timestamp: new Date().toISOString(),
        data: {
            secretValue: 'This data is only accessible to users with premium tokens',
            accessLevel: 'premium',
            additionalFeatures: [
                'Higher rate limits',
                'Priority processing',
                'Advanced analytics',
                'Extended data retention',
            ],
        },
    });
}
