'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ErrorPage() {
    const searchParams = useSearchParams();
    const errorCode = searchParams.get('code') || 'SERVER_ERROR';
    const message = searchParams.get('message') || 'An error occurred';
    const returnUrl = searchParams.get('returnUrl') || '/';

    const getErrorTitle = () => {
        switch (errorCode) {
            case 'SERVER_ERROR':
                return 'Server Error';
            case 'CONTRACT_ERROR':
                return 'Blockchain Connection Error';
            case 'AUTH_INVALID':
                return 'Authentication Error';
            case 'AUTH_MISSING':
                return 'Authentication Required';
            default:
                return 'Error';
        }
    };

    const getErrorMessage = () => {
        switch (errorCode) {
            case 'SERVER_ERROR':
                return 'An unexpected server error occurred. Please try again later.';
            case 'CONTRACT_ERROR':
                return 'There was an error connecting to the blockchain. Please try again later.';
            case 'AUTH_INVALID':
                return 'Your authentication is invalid or has expired. Please log in again.';
            case 'AUTH_MISSING':
                return 'Authentication is required to access this resource.';
            default:
                return message || 'An error occurred. Please try again later.';
        }
    };

    const getErrorAction = () => {
        switch (errorCode) {
            case 'SERVER_ERROR':
            case 'CONTRACT_ERROR':
                return (
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Link href="/" className="btn btn-primary w-full sm:w-auto">
                            Return to Home
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="btn btn-secondary w-full sm:w-auto"
                        >
                            Try Again
                        </button>
                    </div>
                );
            case 'AUTH_INVALID':
            case 'AUTH_MISSING':
                return (
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Link
                            href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                            className="btn btn-primary w-full sm:w-auto"
                        >
                            Log In
                        </Link>
                        <Link href="/" className="btn btn-secondary w-full sm:w-auto">
                            Return to Home
                        </Link>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Link href="/" className="btn btn-primary w-full sm:w-auto">
                            Return to Home
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="btn btn-secondary w-full sm:w-auto"
                        >
                            Go Back
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="card text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-6">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        role="img"
                        aria-label="Error alert icon"
                    >
                        <title>Error Alert</title>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold mb-2">{getErrorTitle()}</h1>

                <p className="text-lg mb-6">{getErrorMessage()}</p>

                {errorCode && (
                    <div className="mb-6">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Error Code</p>
                        <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm">
                            {errorCode}
                        </code>
                    </div>
                )}

                <div className="flex justify-center">{getErrorAction()}</div>
            </div>
        </div>
    );
}
