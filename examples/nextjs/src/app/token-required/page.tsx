'use client';

import TokenPurchaseModalSimple from '@/components/ui/token-purchase-modal-simple';
import type { TokenMetadata } from '@/types/evmauth';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TokenRequiredPage() {
    const searchParams = useSearchParams();
    const tokenId = Number.parseInt(searchParams.get('tokenId') || '0');
    const errorCode = searchParams.get('error') || 'TOKEN_MISSING';
    const returnUrl = searchParams.get('returnUrl') || '/';

    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);

    useEffect(() => {
        const fetchTokenInfo = async () => {
            try {
                // Fetch token metadata
                const response = await fetch(`/api/tokens?id=${tokenId}`);

                if (response.ok) {
                    const data = await response.json();
                    setTokenMetadata(data);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching token info:', error);
                setLoading(false);
            }
        };

        fetchTokenInfo();
    }, [tokenId]);

    const getErrorMessage = () => {
        switch (errorCode) {
            case 'TOKEN_MISSING':
                return 'You need to own this token to access the requested resource.';
            case 'TOKEN_INSUFFICIENT':
                return "You don't have enough of this token to access the requested resource.";
            case 'TOKEN_EXPIRED':
                return 'Your token has expired. Please purchase a new one.';
            default:
                return 'Token validation failed. Please purchase the required token.';
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Token Required</h1>

            <div className="card">
                <div className="flex items-center mb-6 text-red-600 dark:text-red-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        role="img"
                        aria-label="Warning icon"
                    >
                        <title>Warning</title>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <p className="font-semibold">{getErrorMessage()}</p>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">
                            {tokenMetadata?.name || `Token #${tokenId}`}
                        </h2>

                        <p className="mb-6">
                            {tokenMetadata?.description ||
                                'This token provides access to protected resources.'}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Price</p>
                                <p className="font-semibold">
                                    {tokenMetadata?.priceInEth?.toFixed(3) || '0.05'} ETH
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    (${tokenMetadata?.fiatPrice.toFixed(2) || '9.99'} USD)
                                </p>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Valid for
                                </p>
                                <p className="font-semibold">
                                    {tokenMetadata?.timeToLive
                                        ? `${Math.floor(tokenMetadata.timeToLive / 60)} minutes`
                                        : '1 hour'}
                                </p>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Transferable
                                </p>
                                <p className="font-semibold">
                                    {tokenMetadata?.transferable ? 'Yes' : 'No'}
                                </p>
                            </div>

                            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Usage</p>
                                <p className="font-semibold">
                                    {tokenMetadata?.metered ? 'Metered' : 'Unlimited'}
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded mb-6">
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
                                    <p className="font-medium">Demo Mode</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        This example uses a pre-configured wallet for demonstration
                                        purposes. In a production application, users would connect
                                        their own wallets and pay
                                        {tokenMetadata?.priceInEth
                                            ? ` ${tokenMetadata.priceInEth} ETH`
                                            : ' with ETH'}
                                        .
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <button
                                type="button"
                                className="btn btn-primary w-full sm:w-auto"
                                onClick={() => setShowModal(true)}
                            >
                                Purchase Token
                            </button>

                            <a
                                href="/"
                                className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline text-center w-full sm:w-auto"
                            >
                                Return to Home
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <TokenPurchaseModalSimple
                    isOpen={showModal}
                    tokenId={tokenId}
                    tokenMetadata={tokenMetadata || undefined}
                    returnUrl={returnUrl}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}
