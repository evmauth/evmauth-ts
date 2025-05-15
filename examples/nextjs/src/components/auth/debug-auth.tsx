'use client';

import { useEffect, useState } from 'react';

// Define the expected structure of the debug info
interface AuthDebugInfo {
    authenticated?: boolean;
    walletAddress?: string;
    debugInfo?: {
        hasCookie?: boolean;
        hasAuthToken?: boolean;
        tokenValid?: boolean;
        tokenExpiry?: string;
    };
}

/**
 * Debug component for authentication status
 * This component displays detailed authentication information to help debug issues
 */
export default function DebugAuth() {
    const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAuthStatus = async () => {
            try {
                // Fetch auth status from API
                const response = await fetch('/api/auth/status');

                if (!response.ok) {
                    throw new Error('Failed to fetch auth status');
                }

                const data = await response.json();
                setDebugInfo(data);
                setLoading(false);
            } catch (err) {
                setError((err as Error).message);
                setLoading(false);
            }
        };

        fetchAuthStatus();
    }, []);

    if (loading) {
        return <div className="bg-slate-200 dark:bg-slate-700 h-10 w-full rounded animate-pulse" />;
    }

    if (error) {
        return (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 p-3 rounded">
                <p className="text-red-700 dark:text-red-300">Error: {error}</p>
            </div>
        );
    }

    const isAuthenticated = debugInfo?.authenticated;
    const walletAddress = debugInfo?.walletAddress;
    const hasCookie = debugInfo?.debugInfo?.hasCookie;
    const hasAuthToken = debugInfo?.debugInfo?.hasAuthToken;
    const tokenValid = debugInfo?.debugInfo?.tokenValid;
    const tokenExpiry = debugInfo?.debugInfo?.tokenExpiry;

    return (
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border border-slate-300 dark:border-slate-700">
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <div
                        className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <span className="font-medium">
                        Authentication Status:{' '}
                        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                    </span>
                </div>

                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Wallet Address: {walletAddress || 'None'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div
                        className={`p-2 rounded ${hasCookie ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
                    >
                        <p className="font-medium">Has Auth Cookie: {hasCookie ? 'Yes' : 'No'}</p>
                    </div>

                    <div
                        className={`p-2 rounded ${hasAuthToken ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
                    >
                        <p className="font-medium">
                            Token Extracted: {hasAuthToken ? 'Yes' : 'No'}
                        </p>
                    </div>

                    <div
                        className={`p-2 rounded ${tokenValid ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
                    >
                        <p className="font-medium">Token Valid: {tokenValid ? 'Yes' : 'No'}</p>
                    </div>

                    {tokenExpiry && (
                        <div className="p-2 rounded bg-blue-100 dark:bg-blue-900">
                            <p className="font-medium">
                                Expires: {new Date(tokenExpiry).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
