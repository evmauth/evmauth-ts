'use client';

import { ENV } from '@/lib/evmauth/config';
import { logger } from '@/lib/evmauth/logger';
import type { TokenMetadata } from '@/types/evmauth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TokenPurchaseModalSimpleProps {
    isOpen: boolean;
    onClose: () => void;
    tokenId: number;
    tokenMetadata?: TokenMetadata;
    returnUrl?: string;
}

/**
 * Simplified token purchase modal component
 *
 * This component displays token information and allows purchasing tokens
 * using a demo wallet without requiring wallet connection.
 *
 * IMPORTANT: This is for local development and demonstration only.
 * Production applications should use proper wallet connections.
 */
export default function TokenPurchaseModalSimple({
    isOpen,
    onClose,
    tokenId,
    tokenMetadata,
    returnUrl = '/protected',
}: TokenPurchaseModalSimpleProps) {
    const router = useRouter();
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    // Function to purchase token
    const purchaseToken = async () => {
        setIsPurchasing(true);
        setPurchaseError(null);

        try {
            // Call our purchase API
            const response = await fetch('/api/tokens/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tokenId,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to purchase token');
            }

            // Store transaction hash
            setTxHash(data.txHash);
            setPurchaseSuccess(true);

            // Get authentication token for the demo wallet
            try {
                const authResponse = await fetch('/api/auth/demo-token');
                if (!authResponse.ok) {
                    console.error('Failed to get demo wallet auth token');
                } else {
                    logger.info({
                        category: 'client',
                        message: 'Demo wallet authenticated for token purchase',
                        component: 'token-purchase-modal-simple',
                    });
                }
            } catch (authError) {
                console.error('Error getting demo wallet auth token:', authError);
            }

            // Redirect to the protected page after a short delay
            setTimeout(() => {
                // Navigate to the return URL (protected page)
                router.push(returnUrl);
                onClose();
            }, 2000);
        } catch (error) {
            logger.error({
                category: 'client',
                message: 'Failed to purchase token',
                component: 'token-purchase-modal-simple',
                data: { error },
            });
            setPurchaseError((error as Error).message || 'Failed to purchase token');
        } finally {
            setIsPurchasing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 p-4">
                    <h2 className="text-2xl font-semibold">Purchase Token</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        aria-label="Close modal"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">
                            {tokenMetadata?.name || `Token #${tokenId}`}
                        </h3>

                        <p className="mb-4">
                            {tokenMetadata?.description ||
                                'This token provides access to protected resources.'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Price</p>
                                <p className="font-semibold">
                                    {tokenMetadata?.priceInEth?.toFixed(3) || '0.05'} ETH
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    (${tokenMetadata?.fiatPrice.toFixed(2) || '9.99'} USD)
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Valid for
                                </p>
                                <p className="font-semibold">
                                    {tokenMetadata?.timeToLive
                                        ? `${Math.floor(tokenMetadata.timeToLive / 60)} minutes`
                                        : '1 hour'}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded mb-4">
                            <div className="flex items-start">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 text-yellow-500 mr-2 mt-0.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-hidden="true"
                                >
                                    <title>Warning</title>
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                                <div>
                                    <p className="font-medium text-sm">Demo Mode</p>
                                    <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                                        This example uses a pre-configured wallet for demonstration
                                        purposes only. In a real application, you would connect your
                                        own wallet and pay
                                        {tokenMetadata?.priceInEth
                                            ? ` ${tokenMetadata.priceInEth} ETH`
                                            : ' with ETH'}
                                        .
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded mb-4">
                            <p className="text-sm">
                                <span className="font-semibold">Demo wallet address:</span>{' '}
                                {ENV.DEMO_WALLET_ADDRESS || '0x...'}
                            </p>
                        </div>
                    </div>

                    {purchaseError && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                            {purchaseError}
                        </div>
                    )}

                    {purchaseSuccess && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                            <p className="font-semibold">Token purchased successfully!</p>
                            {txHash && (
                                <p className="text-sm mt-1">
                                    Transaction: <code className="text-xs break-all">{txHash}</code>
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col space-y-3">
                        {!purchaseSuccess && (
                            <button
                                type="button"
                                onClick={purchaseToken}
                                disabled={isPurchasing}
                                className="w-full btn btn-primary"
                            >
                                {isPurchasing ? 'Processing...' : 'Purchase Token'}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full btn btn-secondary mt-2"
                        >
                            {purchaseSuccess ? 'Close' : 'Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
