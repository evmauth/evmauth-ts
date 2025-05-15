'use client';

import AuthStatus from '@/components/auth/auth-status';
import DebugAuth from '@/components/auth/debug-auth';
import { useEffect, useState } from 'react';

export default function ProtectedPage() {
    const [userData, setUserData] = useState({
        walletAddress: '',
        accessLevel: 'basic',
        timestamp: '',
        loading: true,
        error: null as string | null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Call protected API to get user data
                const response = await fetch('/api/protected');

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();

                setUserData({
                    walletAddress: data.walletAddress,
                    accessLevel: data.data.accessLevel,
                    timestamp: data.timestamp,
                    loading: false,
                    error: null,
                });
            } catch (error) {
                setUserData({
                    walletAddress: '',
                    accessLevel: '',
                    timestamp: '',
                    loading: false,
                    error: (error as Error).message,
                });
            }
        };

        fetchData();
    }, []);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Protected Page</h1>
                <div>
                    <AuthStatus />
                </div>
            </div>

            <div className="card">
                <h2 className="text-2xl font-semibold mb-4">Basic Access</h2>
                <p className="mb-6">
                    This page is protected by EVMAuth middleware and requires Token #0 (Basic
                    Access) to view.{' '}
                    <strong>
                        If you're seeing this content, it means you have successfully authenticated
                        and have the required token.
                    </strong>
                </p>

                {userData.loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                    </div>
                ) : userData.error ? (
                    <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-100 px-4 py-3 rounded mb-4">
                        <p>Error loading data: {userData.error}</p>
                    </div>
                ) : (
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">Your Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Wallet Address
                                </p>
                                <code className="bg-white dark:bg-slate-800 px-2 py-1 rounded block overflow-hidden text-ellipsis">
                                    {userData.walletAddress}
                                </code>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Access Level
                                </p>
                                <p className="font-semibold capitalize">{userData.accessLevel}</p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Timestamp
                                </p>
                                <p>{new Date(userData.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="card mt-6">
                <h2 className="text-2xl font-semibold mb-4">Authentication Details</h2>
                <DebugAuth />
            </div>

            <div className="card mt-6">
                <h2 className="text-2xl font-semibold mb-4">Try Premium Access</h2>
                <p className="mb-4">Want to see what's available with premium access?</p>
                <a href="/protected/premium" className="btn btn-primary inline-block">
                    Go to Premium Content
                </a>
            </div>
        </div>
    );
}
