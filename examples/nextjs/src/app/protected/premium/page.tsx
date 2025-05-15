'use client';

import AuthStatus from '@/components/auth/auth-status';
import { useEffect, useState } from 'react';

export default function PremiumProtectedPage() {
    const [userData, setUserData] = useState({
        walletAddress: '',
        accessLevel: '',
        timestamp: '',
        additionalFeatures: [] as string[],
        loading: true,
        error: null as string | null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Call protected API to get user data
                const response = await fetch('/api/protected/premium');

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();

                setUserData({
                    walletAddress: data.walletAddress,
                    accessLevel: data.data.accessLevel,
                    timestamp: data.timestamp,
                    additionalFeatures: data.data.additionalFeatures || [],
                    loading: false,
                    error: null,
                });
            } catch (error) {
                setUserData({
                    walletAddress: '',
                    accessLevel: '',
                    timestamp: '',
                    additionalFeatures: [],
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
                <h1 className="text-3xl font-bold">Premium Protected Page</h1>
                <div>
                    <AuthStatus />
                </div>
            </div>

            <div className="card bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="flex items-center mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        role="img"
                        aria-label="Premium feature icon"
                    >
                        <title>Premium Feature</title>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                    </svg>
                    <h2 className="text-2xl font-bold">Premium Access</h2>
                </div>
                <p className="mb-6">
                    This page is protected by EVMAuth middleware and requires Token #1 (Premium
                    Access) to view.{' '}
                    <strong>
                        If you're seeing this content, it means you have successfully authenticated
                        and have the premium token.
                    </strong>
                </p>

                {userData.loading ? (
                    <div className="animate-pulse space-y-4 bg-white bg-opacity-10 rounded-lg p-4">
                        <div className="h-8 bg-white bg-opacity-20 rounded w-1/3" />
                        <div className="h-4 bg-white bg-opacity-20 rounded w-1/2" />
                        <div className="h-4 bg-white bg-opacity-20 rounded w-1/4" />
                    </div>
                ) : userData.error ? (
                    <div className="bg-red-500 bg-opacity-30 border border-red-400 px-4 py-3 rounded mb-4">
                        <p>Error loading data: {userData.error}</p>
                    </div>
                ) : (
                    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">Your Premium Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-white text-opacity-70">Wallet Address</p>
                                <code className="bg-white bg-opacity-10 px-2 py-1 rounded block overflow-hidden text-ellipsis">
                                    {userData.walletAddress}
                                </code>
                            </div>

                            <div>
                                <p className="text-sm text-white text-opacity-70">Access Level</p>
                                <p className="font-semibold capitalize">{userData.accessLevel}</p>
                            </div>

                            <div>
                                <p className="text-sm text-white text-opacity-70">Timestamp</p>
                                <p>{new Date(userData.timestamp).toLocaleString()}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Premium Features</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {userData.additionalFeatures.map((feature) => (
                                    <li key={feature}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="card mt-6">
                <h2 className="text-2xl font-semibold mb-4">Exclusive Premium Content</h2>
                <p className="mb-4">
                    This content is only visible to users with Premium Access. You can access all
                    the basic features plus these premium benefits:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded">
                        <h3 className="text-xl font-semibold mb-2">Higher Rate Limits</h3>
                        <p>Make more API calls with increased rate limits for premium users.</p>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded">
                        <h3 className="text-xl font-semibold mb-2">Priority Processing</h3>
                        <p>Your requests get processed with higher priority in the queue.</p>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded">
                        <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
                        <p>Access detailed analytics and insights about your usage.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center mt-6">
                <a href="/protected" className="btn btn-secondary">
                    Back to Basic Access
                </a>
            </div>
        </div>
    );
}
