import { NextResponse } from 'next/server';

/**
 * Premium Protected API Route
 *
 * This endpoint is protected by the middleware in src/middleware.ts
 * It requires Token #1 (Premium) to access this route.
 *
 * The middleware validates that the provided wallet address has the required premium token balance.
 * If successful, the wallet address is passed in the x-wallet-address header.
 *
 * NOTE: The wallet address is passed from the middleware after token validation.
 * In a production application, you would implement proper authentication
 * to ensure the user owns this wallet address.
 */
export async function GET(req: Request): Promise<NextResponse> {
    // Get wallet address from request header (set by middleware)
    const walletAddress = req.headers.get('x-wallet-address');

    return NextResponse.json({
        success: true,
        message: 'This is premium protected content that requires premium token ownership',
        walletAddress,
        timestamp: new Date().toISOString(),
        data: {
            content: 'This premium data is only accessible to users with premium tokens',
            tokenType: 'premium',
            features: ['Exclusive premium content', 'Higher rate limits', 'Priority support'],
        },
    });
}
