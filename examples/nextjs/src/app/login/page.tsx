'use client';

import LoginRedirect from '@/components/auth/login-redirect';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl') || '/protected';

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Authentication Required</h1>

            <div className="card">
                <p className="mb-6">
                    To access protected resources, you need to authenticate using your Ethereum
                    wallet. This allows us to verify your token ownership on the blockchain.
                </p>

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
                                purposes. In a production application, users would connect their own
                                wallets.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Auto-login with demo wallet */}
                <LoginRedirect returnUrl={returnUrl} />
            </div>
        </div>
    );
}
