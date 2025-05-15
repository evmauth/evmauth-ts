import { NextResponse } from 'next/server';

/**
 * GET /api/protected - Protected API endpoint that requires authentication
 *
 * Note: This endpoint is protected by the middleware in src/middleware.ts
 * If the request reaches this handler, it means the user is authenticated
 * and has the required tokens.
 *
 * @returns Protected data
 */
export async function GET(req: Request): Promise<NextResponse> {
    // Get wallet address from request header (set by middleware)
    const walletAddress = req.headers.get('x-wallet-address');

    return NextResponse.json({
        success: true,
        message: 'This is protected data that requires authentication and token ownership',
        walletAddress,
        timestamp: new Date().toISOString(),
        data: {
            secretValue:
                'This data is only accessible to authenticated users with the required tokens',
            accessLevel: 'basic',
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

        // Process the submitted data (in a real app, you would store it in a database)
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
