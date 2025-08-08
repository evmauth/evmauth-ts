import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Configuration for payment responses
 */
const contractAddress =
    process.env.NEXT_PUBLIC_EVMAUTH_CONTRACT_ADDRESS ||
    '0x1234567890123456789012345678901234567890';
const networkId = process.env.NEXT_PUBLIC_NETWORK_ID || '1223953'; // Radius Testnet

/**
 * Create a 402 Payment Required response for API routes
 * @param tokenId The token ID required for access
 * @param amount The amount of tokens required
 * @param options Additional options for the response
 * @returns NextResponse with payment required error
 */
export function createPaymentRequiredResponse(
    tokenId: number,
    amount = 1,
    options?: {
        message?: string;
        operationId?: string;
        walletAddress?: string;
        pathname?: string;
    }
): NextResponse {
    // Log the payment required response
    if (options?.operationId) {
        logger.warn({
            category: 'api',
            message: `Payment required for token #${tokenId} to access ${options.pathname || 'protected resource'}`,
            component: 'response-utils',
            operationId: options.operationId,
            data: {
                tokenId,
                amount,
                walletAddress: options.walletAddress,
                pathname: options.pathname,
            },
        });
    }

    // Create response body
    const responseBody = {
        error: 'Payment Required',
        message: options?.message || 'EVMAuth token purchase required to access this resource',
        details: {
            contractAddress,
            networkId,
            tokenId,
            amount,
        },
    };

    // Return JSON response with 402 status code
    return NextResponse.json(responseBody, { status: 402 });
}

/**
 * Create a standard error response for API routes
 * @param status HTTP status code
 * @param message Error message
 * @param code Error code
 * @returns NextResponse with error
 */
export function createErrorResponse(
    status = 500,
    message = 'Server Error',
    code = 'SERVER_ERROR'
): NextResponse {
    return NextResponse.json(
        {
            error: code,
            message,
        },
        { status }
    );
}
