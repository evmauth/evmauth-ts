import { NextResponse } from 'next/server';

/**
 * Protected API Route
 *
 * This endpoint is protected by the middleware in src/middleware.ts
 * It requires token ownership to access.
 *
 * The middleware validates that the provided wallet address has the required token balance.
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
        message: 'This is protected content that requires token ownership',
        walletAddress,
        timestamp: new Date().toISOString(),
        data: {
            content: 'This data is only accessible to users with the required tokens',
            tokenType: 'basic',
        },
    });
}

/**
 * POST /api/protected - Protected API endpoint for data submission
 *
 * @param req The request object
 * @returns Response with the processed data
 */
export async function POST(req: Request): Promise<NextResponse> {
    try {
        // Get wallet address from request header (set by middleware)
        const walletAddress = req.headers.get('x-wallet-address');

        // Parse request body
        const body = await req.json();

        // Process the submitted data
        return NextResponse.json({
            success: true,
            message: 'Data submitted successfully',
            walletAddress,
            processedData: {
                ...body,
                timestamp: new Date().toISOString(),
                processed: true,
            },
        });
    } catch (error) {
        console.error('Error processing protected data submission:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process data submission',
            },
            { status: 500 }
        );
    }
}
