import { ethers } from 'ethers';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { type RouteConfig, paymentMiddleware } from 'x402-express';
import { auth } from './auth.js';
import { contractAddress, networkId } from './config.js';

type Address = `0x${string}`;

/**
 * Middleware to require direct purchase of a token via the EVMAuth contract.
 *
 * @param {number} tokenId - The ID of the token to check.
 * @param {number} amount - The required amount of tokens.
 * @param {RouteConfig | null} routeConfig - Optional route configuration for x402 middleware.
 * @return {RequestHandler} - The middleware function.
 */
export function paymentRequired(
    tokenId: number,
    amount: number,
    routeConfig: RouteConfig | null = null
): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // For demonstration purposes, we are passing the user's wallet address as a URL query parameter here.
        // In a real-world application, you would authenticate the user to verify they own the wallet address,
        // using something like the `@evmauth/eip712-authn` NPM package.
        const walletAddress = req.query.address as string;
        const tokenBalance = ethers.isAddress(walletAddress)
            ? await auth.balanceOf(walletAddress, tokenId)
            : 0;

        // If the user has the required token balance, proceed to the next middleware or route handler.
        if (tokenBalance >= amount) {
            return next();
        }

        // If a routeConfig is provided, use the x402 middleware to inform the user that payment is required.
        if (routeConfig) {
            const payTo: Address = (await auth.wallet()) as Address;
            const route = req.path;
            return paymentMiddleware(payTo, { [route]: routeConfig })(req, res, next);
        }

        // If no routeConfig is provided, use a custom 402 response to inform the user that payment is required.
        res.status(402).json({
            error: 'Payment Required',
            message: 'EVMAuth token purchase required to access this resource.',
            contractAddress,
            networkId,
            tokenId,
            amount,
        });
    };
}
