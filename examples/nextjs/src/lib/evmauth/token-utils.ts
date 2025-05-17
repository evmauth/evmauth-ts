import type { AcquisitionStep, PurchaseOption, TokenMetadata } from '@/types/evmauth';
import { ENV } from './config';

/**
 * Token metadata lookup
 * Maps token IDs to their metadata
 */
export const TOKEN_METADATA: Record<number, TokenMetadata> = {
    0: {
        id: 0,
        name: 'Basic Access',
        description: 'Provides basic access to the API and services',
        fiatPrice: 9.99,
        priceInEth: 0.05,
        ethPriceWei: '50000000000000000', // 0.05 ETH in wei
        timeToLive: 60 * 60, // 1 hour in seconds
        transferable: false,
        metered: false,
        burnedOnUse: false,
    },
    1: {
        id: 1,
        name: 'Premium Access',
        description: 'Provides premium access with higher rate limits and prioritized services',
        fiatPrice: 29.99,
        priceInEth: 0.2,
        ethPriceWei: '200000000000000000', // 0.2 ETH in wei
        timeToLive: 60 * 60, // 1 hour in seconds
        transferable: false,
        metered: true,
        burnedOnUse: false,
    },
};

/**
 * Get metadata for a token
 * @param tokenId The token ID
 * @returns The token metadata or undefined if not found
 */
export function getTokenMetadata(tokenId: number): TokenMetadata | undefined {
    return TOKEN_METADATA[tokenId];
}

/**
 * Get all available token metadata
 * @returns Array of token metadata
 */
export function getAllTokenMetadata(): TokenMetadata[] {
    return Object.values(TOKEN_METADATA);
}

/**
 * Get the acquisition steps for a token
 * @param tokenId The token ID
 * @param errorCode The error code if there was an error
 * @returns Array of steps to acquire the token
 */
export function getTokenAcquisitionSteps(tokenId: number, errorCode?: string): AcquisitionStep[] {
    // Common purchase steps
    const purchaseSteps: AcquisitionStep[] = [
        {
            step: 1,
            action: 'authenticate',
            description: 'Connect your wallet to authenticate',
        },
        {
            step: 2,
            action: 'purchase',
            description: `Purchase the ${getTokenMetadata(tokenId)?.name || 'required token'}`,
        },
    ];

    // Different steps based on error code
    switch (errorCode) {
        case 'TOKEN_EXPIRED':
            return [
                {
                    step: 1,
                    action: 'authenticate',
                    description: 'Connect your wallet to authenticate',
                },
                {
                    step: 2,
                    action: 'renew',
                    description: `Renew your ${getTokenMetadata(tokenId)?.name || 'token'}`,
                },
            ];

        case 'TOKEN_INSUFFICIENT':
            return [
                {
                    step: 1,
                    action: 'authenticate',
                    description: 'Connect your wallet to authenticate',
                },
                {
                    step: 2,
                    action: 'upgrade',
                    description: `Upgrade to the required ${getTokenMetadata(tokenId)?.name || 'token'} level`,
                },
            ];

        default:
            return purchaseSteps;
    }
}

/**
 * Get purchase options for a token
 * @param tokenId The token ID
 * @returns Array of purchase options
 */
export function getTokenPurchaseOptions(tokenId: number): PurchaseOption[] {
    const token = getTokenMetadata(tokenId);

    if (!token) {
        return [];
    }

    return [
        {
            method: 'crypto',
            provider: 'MetaMask',
            url: `${ENV.APP_URL}/purchase/${tokenId}?method=crypto`,
        },
        {
            method: 'fiat',
            provider: 'Stripe',
            url: `${ENV.APP_URL}/purchase/${tokenId}?method=fiat`,
        },
        {
            method: 'dapp',
            provider: 'EVMAuth Marketplace',
            url: `https://marketplace.evmauth.dev/token/${tokenId}?redirect=${encodeURIComponent(ENV.APP_URL)}`,
        },
    ];
}
