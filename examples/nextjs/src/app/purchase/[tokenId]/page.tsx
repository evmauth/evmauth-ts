'use client';

import type { TokenMetadata } from '@/types/evmauth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PurchasePage({ params }: { params: { tokenId: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tokenId = Number.parseInt(params.tokenId);
    const returnUrl = searchParams.get('returnUrl') || '/';

    const [loading, setLoading] = useState(true);
    const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);

    // Fetch token metadata
    useEffect(() => {
        const fetchTokenInfo = async () => {
            try {
                const response = await fetch(`/api/tokens?id=${tokenId}`);
                if (response.ok) {
                    const data = await response.json();
                    setTokenMetadata(data);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching token info:', err);
                setLoading(false);
            }
        };

        fetchTokenInfo();
    }, [tokenId]);

    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get connected wallet address
    useEffect(() => {
        const getConnectedWallet = async () => {
            try {
                if (typeof window.ethereum !== 'undefined') {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts && accounts.length > 0) {
                        setWalletAddress(accounts[0]);
                    }
                }
            } catch (err) {
                console.error('Error getting connected accounts:', err);
            }
        };

        getConnectedWallet();
    }, []);

    const handlePurchaseWithWallet = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Get contract address from environment
            const contractAddress = process.env.NEXT_PUBLIC_EVMAUTH_CONTRACT_ADDRESS;

            if (!contractAddress) {
                throw new Error('Contract address not configured');
            }

            if (!walletAddress) {
                throw new Error('Wallet not connected');
            }

            // For a real implementation, this would call the contract's purchase function
            // This would involve preparing and sending the transaction to the blockchain

            // After successful purchase, redirect back to the protected resource
            setTimeout(() => {
                router.push(returnUrl);
            }, 500);
        } catch (err) {
            console.error('Purchase error:', err);
            setError(err instanceof Error ? err.message : 'Failed to process payment');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Purchase Token</h1>

            <div className="card">
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

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mb-6">
                            <h3 className="text-lg font-semibold mb-4">Connected Wallet</h3>

                            {walletAddress ? (
                                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded mb-4">
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                                        Your wallet:
                                    </p>
                                    <p className="font-mono text-sm break-all">{walletAddress}</p>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded p-4 mb-4">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        No wallet connected. Please return to login and connect your
                                        wallet.
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Clicking "Purchase Token" will send a transaction from your
                                connected wallet to purchase this token. You will need sufficient
                                ETH in your wallet to complete this transaction.
                            </p>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded p-4 mb-4">
                                    <p className="text-sm text-red-800 dark:text-red-200">
                                        {error}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => router.push(returnUrl)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePurchaseWithWallet}
                                disabled={!walletAddress || isProcessing}
                                className="btn btn-primary"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            aria-labelledby="loadingIcon"
                                        >
                                            <title id="loadingIcon">Loading indicator</title>
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    'Purchase Token'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
