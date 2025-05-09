import { ethers } from 'ethers';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { auth } from './auth.js';
import { contractAddress, networkId } from './config.js';

/**
 * Middleware to check if the user has the required token balance.
 * If not, respond with a 402 Payment Required error.
 *
 * @param {number} tokenId - The ID of the token to check.
 * @param {number} amount - The required amount of tokens.
 * @return {RequestHandler} - The middleware function.
 */
export function paymentRequired(tokenId: number, amount: number): RequestHandler {
    // Define the response body for the 402 Payment Required error.
    const x402ResponseBody = {
        error: 'Payment Required',
        message: 'EVMAuth token purchase required to access this resource.',
        contractAddress,
        networkId,
        tokenId,
        amount,
    };

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // For demonstration purposes, we are passing the user's wallet address as a URL query parameter here.
        // In a real-world application, you would authenticate the user to verify they own the wallet address,
        // using EIP-712 message signing, then issue a JWT or session cookie containing the wallet address.
        const walletAddress = req.query.address as string;
        if (!walletAddress || !ethers.isAddress(walletAddress)) {
            res.status(402).json(x402ResponseBody);
            return;
        }

        // Check if the wallet address has the required token balance.
        const tokenBalance = await auth.balanceOf(walletAddress, tokenId);
        if (tokenBalance < amount) {
            res.status(402).json(x402ResponseBody);
            return;
        }

        // The user has the required token balance, so proceed to the next middleware or route handler.
        return next();
    };
}
