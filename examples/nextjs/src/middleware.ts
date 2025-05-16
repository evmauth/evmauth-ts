import { ethers } from 'ethers';
import { EVMAuth } from 'evmauth';
import { NextResponse } from 'next/server';
import { logger } from './lib/evmauth/logger';
import { createPaymentRequiredResponse } from './lib/evmauth/response-utils';

/**
 * EVMAuth Next.js Middleware for Token Validation
 *
 * This middleware intercepts requests to protected routes and verifies token ownership.
 * It expects a wallet address to be provided as a query parameter ('address').
 *
 * For simplicity, this example does not include authentication to verify wallet ownership.
 * In a production application, you would implement proper wallet authentication.
 */

// Configuration
// Using hardcoded values for middleware as it may not have access to environment variables at runtime
const contractAddress = '0x1943B30909692B6539dD888D8dc0Ad7aF070e01A'; // From NEXT_PUBLIC_EVMAUTH_CONTRACT_ADDRESS
const rpcUrl = 'https://rpc.testnet.tryradi.us/03e50e44eff27b9608b2820a56cc71a18c666e821d6e14a2'; // From NEXT_PUBLIC_EVMAUTH_RPC_URL

// Initialize EVMAuth
const provider = new ethers.JsonRpcProvider(rpcUrl);
const auth = new EVMAuth(contractAddress, provider);

/**
 * Simplified middleware that only checks token ownership
 * No authentication is performed - wallet address is taken from query parameters
 *
 * NOTE: In a production application, you would authenticate the user
 * to verify they own the wallet address, rather than accepting it directly
 * from a query parameter.
 */
export async function middleware(request: Request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Skip middleware for non-protected paths
    if (!pathname.startsWith('/api/protected')) {
        return NextResponse.next();
    }

    // Get wallet address from query parameter
    const walletAddress = url.searchParams.get('address');

    // Validate wallet address
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
        logger.warn({
            category: 'middleware',
            component: 'token-validator',
            message: `Invalid or missing wallet address for protected path: ${pathname}`,
            data: { pathname },
        });

        return createPaymentRequiredResponse(0, 1);
    }

    // Determine token requirement based on path
    // Default to token ID 0 for basic access
    let tokenId = 0;
    let requiredAmount = 1;

    // Special case for premium content
    if (pathname.includes('/premium')) {
        tokenId = 1; // Premium token ID
        requiredAmount = 1;
    }

    try {
        // Check token balance
        const tokenBalance = await auth.balanceOf(walletAddress, tokenId);

        // If token balance is insufficient, return payment required
        if (tokenBalance < requiredAmount) {
            logger.warn({
                category: 'middleware',
                component: 'token-validator',
                message: `Insufficient token balance for ${walletAddress} on ${pathname}`,
                data: {
                    walletAddress,
                    pathname,
                    tokenId,
                    requiredAmount,
                    actualBalance: tokenBalance.toString(),
                },
            });

            return createPaymentRequiredResponse(tokenId, requiredAmount);
        }

        // Token validation passed, add wallet address to headers
        logger.info({
            category: 'middleware',
            component: 'token-validator',
            message: `Token validation successful for ${walletAddress} on ${pathname}`,
            data: { walletAddress, pathname, tokenId, requiredAmount },
        });

        const response = NextResponse.next();
        response.headers.set('x-wallet-address', walletAddress);
        return response;
    } catch (error) {
        logger.error({
            category: 'middleware',
            component: 'token-validator',
            message: 'Error during token validation',
            data: {
                error,
                walletAddress,
                pathname,
            },
        });

        // Return server error
        return NextResponse.json(
            {
                error: 'Server Error',
                message: 'Error validating token ownership',
            },
            { status: 500 }
        );
    }
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
    matcher: [
        // Only run middleware on protected API routes
        '/api/protected/:path*',
    ],
};
