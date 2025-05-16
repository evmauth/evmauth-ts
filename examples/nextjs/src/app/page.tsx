'use client';

import { isPaymentRequiredError, parsePaymentRequiredError } from '@/lib/utils';
import { useState } from 'react';

/**
 * EVMAuth Demo Page
 *
 * This page demonstrates how to access token-gated content using EVMAuth.
 * It allows entering a wallet address and attempting to access protected content.
 *
 * NOTE: This is a simplified example that passes the wallet address directly.
 * In a production application, you would implement wallet connection and
 * signature verification to ensure the user owns the wallet address.
 */

// Define types for our API responses
interface ProtectedContentData {
    content: string;
    tokenType: 'basic' | 'premium';
    features?: string[];
}

interface ProtectedContentResponse {
    success: boolean;
    message: string;
    walletAddress: string;
    timestamp: string;
    data: ProtectedContentData;
}

interface PaymentDetails {
    isPaymentRequired: boolean;
    message: string;
    contractAddress?: string;
    networkId?: string;
    tokenId?: number;
    amount?: number;
    error?: string;
}

export default function Home() {
    const [walletAddress, setWalletAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ProtectedContentResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

    /**
     * Fetch basic protected content
     */
    async function fetchProtectedContent() {
        if (!walletAddress) {
            setError('Please enter a wallet address');
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);
        setPaymentDetails(null);

        try {
            const response = await fetch(`/api/protected?address=${walletAddress}`);

            // Handle payment required error
            if (isPaymentRequiredError(response)) {
                const details = await parsePaymentRequiredError(response);
                setPaymentDetails(details);
                setError('Token purchase required to access this content');
                setLoading(false);
                return;
            }

            // Handle other errors
            if (!response.ok) {
                setError(`Error: ${response.status} ${response.statusText}`);
                setLoading(false);
                return;
            }

            // Handle success
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(`Error: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Fetch premium protected content
     */
    async function fetchPremiumContent() {
        if (!walletAddress) {
            setError('Please enter a wallet address');
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);
        setPaymentDetails(null);

        try {
            const response = await fetch(`/api/protected/premium?address=${walletAddress}`);

            // Handle payment required error
            if (isPaymentRequiredError(response)) {
                const details = await parsePaymentRequiredError(response);
                setPaymentDetails(details);
                setError('Premium token purchase required to access this content');
                setLoading(false);
                return;
            }

            // Handle other errors
            if (!response.ok) {
                setError(`Error: ${response.status} ${response.statusText}`);
                setLoading(false);
                return;
            }

            // Handle success
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(`Error: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-2">EVMAuth Next.js Example</h1>
            <p className="mb-6">
                This example demonstrates how to use EVMAuth for token-gated content in a Next.js
                application.
            </p>

            <div className="mb-6 p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                <h2 className="text-xl font-semibold mb-4">Access Protected Content</h2>
                <div className="mb-4">
                    <label htmlFor="walletAddress" className="block mb-2">
                        Enter wallet address:
                    </label>
                    <input
                        id="walletAddress"
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="0x..."
                    />
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                    <button
                        type="button"
                        onClick={fetchProtectedContent}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        Access Basic Content
                    </button>
                    <button
                        type="button"
                        onClick={fetchPremiumContent}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                    >
                        Access Premium Content
                    </button>
                </div>

                {loading && <div className="animate-pulse">Loading...</div>}

                {error && (
                    <div className="p-4 bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800 border rounded-lg mb-4">
                        <p className="text-red-700 dark:text-red-200">{error}</p>
                        {paymentDetails && (
                            <div className="mt-2">
                                <p className="font-semibold">Token Purchase Required:</p>
                                <ul className="list-disc list-inside pl-2">
                                    <li>Contract: {paymentDetails.contractAddress}</li>
                                    <li>Network ID: {paymentDetails.networkId}</li>
                                    <li>Token ID: {paymentDetails.tokenId}</li>
                                    <li>Amount: {paymentDetails.amount}</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {data && (
                    <div className="p-4 bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800 border rounded-lg">
                        <h3 className="font-semibold mb-2">
                            {data.data?.tokenType === 'premium'
                                ? 'Premium Content'
                                : 'Basic Content'}
                        </h3>
                        <p>Wallet: {data.walletAddress}</p>
                        <p>Message: {data.message}</p>
                        <div className="mt-2">
                            <p className="font-semibold">Data:</p>
                            <pre className="bg-white dark:bg-slate-800 p-2 rounded overflow-auto mt-2">
                                {JSON.stringify(data.data, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
                <h2 className="text-xl font-semibold mb-2">How it Works</h2>
                <p className="mb-4">
                    This example demonstrates EVMAuth's token-gated access control:
                </p>
                <ol className="list-decimal list-inside space-y-2 mb-4">
                    <li>Enter an Ethereum wallet address in the input field</li>
                    <li>Click one of the access buttons to request protected content</li>
                    <li>
                        If the wallet has sufficient token balance, you'll see the protected content
                    </li>
                    <li>
                        If the wallet doesn't have the required tokens, you'll see a payment
                        required error
                    </li>
                </ol>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Note:</strong> In a real application, you would authenticate the user
                    with wallet signing to verify ownership. This example uses a direct wallet
                    address for simplicity.
                </p>
            </div>
        </div>
    );
}