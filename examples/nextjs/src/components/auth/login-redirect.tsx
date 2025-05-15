'use client';

import { useEffect, useState } from 'react';

/**
 * Login redirect component
 * This component automatically redirects to the Demo login
 */
export default function LoginRedirect({ returnUrl = '/protected' }: { returnUrl?: string }) {
    const [error, setError] = useState<string | null>(null);
    const [_isRedirecting, setIsRedirecting] = useState(true);

    useEffect(() => {
        const redirectToLogin = async () => {
            try {
                setIsRedirecting(true);

                // Get auth token via demo login
                window.location.href = `/api/auth/login-demo?returnUrl=${encodeURIComponent(returnUrl)}`;
            } catch (err) {
                setError((err as Error).message);
                setIsRedirecting(false);
            }
        };

        redirectToLogin();
    }, [returnUrl]);

    if (error) {
        return (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-100 px-4 py-3 rounded mb-4">
                <p className="font-semibold">Error during login:</p>
                <p>{error}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="bg-red-600 text-white px-4 py-2 rounded mt-2 hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
            <p>Logging you in automatically...</p>
        </div>
    );
}
