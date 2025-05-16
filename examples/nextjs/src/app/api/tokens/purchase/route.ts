import { mintTokenWithDemoWallet } from '@/lib/evmauth/blockchain';
import { ENV } from '@/lib/evmauth/config';
import { logger } from '@/lib/evmauth/logger';
import { getTokenMetadata } from '@/lib/evmauth/token-utils';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

/**
 * Token Purchase API - Demo Implementation
 *
 * This API endpoint allows purchasing tokens using a pre-configured demo wallet.
 * It is intended for local development and demonstration purposes ONLY.
 *
 * IMPORTANT: This implementation uses a private key stored in environment variables,
 * which is NOT safe for production use. In a real application, users would connect
 * their own wallets and sign transactions themselves.
 *
 * Request body:
 * {
 *   "tokenId": number // The ID of the token to purchase
 * }
 *
 * Success response:
 * {
 *   "success": true,
 *   "txHash": string, // The transaction hash
 *   "tokenId": number, // The purchased token ID
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
 * POST /api/tokens/purchase - Purchase a token using the demo wallet
 * @param req The request object
 * @returns Purchase result
 */
export async function POST(req: Request): Promise<NextResponse> {
    const operationId = nanoid();

    try {
        // Parse request body
        const body = await req.json();
        const { tokenId } = body;

        if (tokenId === undefined || tokenId === null) {
            logger.warn({
                category: 'api',
                message: 'Invalid purchase request - missing tokenId',
                component: 'tokens-purchase-api',
                operationId,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing tokenId parameter',
                    errorCode: 'INVALID_REQUEST',
                },
                { status: 400 }
            );
        }

        // Get token metadata
        const metadata = getTokenMetadata(Number(tokenId));
        if (!metadata) {
            logger.warn({
                category: 'api',
                message: `Token #${tokenId} not found`,
                component: 'tokens-purchase-api',
                operationId,
                data: { tokenId },
            });

            return NextResponse.json(
                {
                    success: false,
                    error: `Token #${tokenId} not found`,
                    errorCode: 'TOKEN_NOT_FOUND',
                },
                { status: 404 }
            );
        }

        // Purchase token using demo wallet
        try {
            const txHash = await mintTokenWithDemoWallet(Number(tokenId));

            logger.info({
                category: 'api',
                message: `Token #${tokenId} purchased successfully`,
                component: 'tokens-purchase-api',
                operationId,
                data: { tokenId, walletAddress: ENV.DEMO_WALLET_ADDRESS, txHash },
            });

            return NextResponse.json({
                success: true,
                txHash,
                tokenId: Number(tokenId),
                walletAddress: ENV.DEMO_WALLET_ADDRESS,
            });
        } catch (error) {
            // Get error details
            const errorMessage = error instanceof Error ? error.message : String(error);

            logger.error({
                category: 'api',
                message: 'Error purchasing token',
                component: 'tokens-purchase-api',
                operationId,
                data: { tokenId, error: errorMessage },
            });

            // Determine appropriate error code
            let errorCode = 'PURCHASE_ERROR';
            let statusCode = 500;

            // Extract specific error cases
            if (errorMessage.includes('insufficient funds')) {
                errorCode = 'INSUFFICIENT_FUNDS';
                statusCode = 400;
            } else if (errorMessage.includes('nonce')) {
                errorCode = 'NONCE_ERROR';
                statusCode = 400;
            } else if (errorMessage.includes('gas')) {
                errorCode = 'GAS_ERROR';
                statusCode = 400;
            } else if (errorMessage.includes('rejected')) {
                errorCode = 'TRANSACTION_REJECTED';
                statusCode = 400;
            } else if (errorMessage.includes('failed on the blockchain')) {
                errorCode = 'BLOCKCHAIN_ERROR';
                statusCode = 400;
            }

            return NextResponse.json(
                {
                    success: false,
                    error: `Failed to purchase token: ${errorMessage}`,
                    errorCode,
                },
                { status: statusCode }
            );
        }
    } catch (error) {
        logger.error({
            category: 'api',
            message: 'Error processing purchase request',
            component: 'tokens-purchase-api',
            operationId,
            data: { error: (error as Error).message },
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Error processing purchase request',
                errorCode: 'SERVER_ERROR',
            },
            { status: 500 }
        );
    }
}
