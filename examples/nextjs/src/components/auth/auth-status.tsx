'use client';

import type { AuthState } from '@/types/evmauth';
import { useCallback, useEffect, useState } from 'react';

/**
 * Authentication status component
 *
 * Displays the current authentication status
 */
export default function AuthStatus() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        loading: true,
        error: undefined,
    });

    // Function to check if the user has access to protected content
    const checkProtectedAccess = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/protected');

            if (response.ok) {
                const data = await response.json();
                if (data.walletAddress) {
                    console.log('Protected API access check succeeded');
                    setAuthState({
                        isAuthenticated: true,
                        walletAddress: data.walletAddress,
                        loading: false,
                        error: undefined,
                    });
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Protected access check failed:', error);
            return false;
        }
    }, []);

    // Function to check authentication status using all available methods
    const checkAllAuthMethods = useCallback(async () => {
        try {
            // First, check if we can access protected content
            // This is the most reliable check because it's what actually matters
            const hasProtectedAccess = await checkProtectedAccess();
            if (hasProtectedAccess) {
                return; // Already set auth state in checkProtectedAccess
            }

            // Check auth status API
            try {
                const statusResponse = await fetch('/api/auth/status');
                if (statusResponse.ok) {
                    const statusData = await statusResponse.json();

                    if (statusData.authenticated) {
                        console.log('Auth status API shows authenticated');
                        setAuthState({
                            isAuthenticated: true,
                            walletAddress: statusData.walletAddress,
                            expiresAt: statusData.debugInfo?.tokenExpiry
                                ? new Date(statusData.debugInfo.tokenExpiry).getTime() / 1000
                                : undefined,
                            loading: false,
                            error: undefined,
                        });
                        return;
                    }
                }
            } catch (statusError) {
                console.error('Error checking auth status API:', statusError);
            }

            // Check for token in cookies as a last resort
            const token = document.cookie
                .split('; ')
                .find((row) => row.startsWith('evmauth_token='))
                ?.split('=')[1];

            if (!token) {
                setAuthState({
                    isAuthenticated: false,
                    loading: false,
                    error: undefined,
                });
                return;
            }

            // Verify token with server
            const response = await fetch('/api/auth/verify', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to verify token');
            }

            const data = await response.json();
            console.log('Auth verify endpoint response:', data);

            setAuthState({
                isAuthenticated: data.success,
                walletAddress: data.walletAddress,
                expiresAt: data.expiresAt,
                loading: false,
                error: undefined,
            });
        } catch (error) {
            console.error('Auth verification failed:', error);
            setAuthState({
                isAuthenticated: false,
                loading: false,
                error: (error as Error).message,
            });
        }
    }, [checkProtectedAccess]);

    useEffect(() => {
        checkAllAuthMethods();
    }, [checkAllAuthMethods]);

    if (authState.loading) {
        return <div className="animate-pulse bg-slate-300 dark:bg-slate-700 h-8 w-48 rounded" />;
    }

    if (!authState.isAuthenticated) {
        return (
            <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Not authenticated</span>
                </div>
                <button
                    type="button"
                    onClick={checkAllAuthMethods}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Refresh status
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Authenticated</span>
            </div>

            {authState.walletAddress && (
                <div className="text-sm mb-2">
                    <span className="font-medium">Wallet:</span>
                    <code className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded ml-2 font-mono">
                        {authState.walletAddress.substring(0, 6)}...
                        {authState.walletAddress.substring(authState.walletAddress.length - 4)}
                    </code>
                </div>
            )}
        </div>
    );
}
