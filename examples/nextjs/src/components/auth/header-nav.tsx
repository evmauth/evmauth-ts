'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Header navigation component with dynamic authentication status
 */
export default function HeaderNav() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    const checkAuthStatus = useCallback(async () => {
        try {
            // Quick auth status check
            const response = await fetch('/api/auth/status');
            if (response.ok) {
                const data = await response.json();
                setIsAuthenticated(!!data.authenticated);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial auth check
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    return (
        <nav>
            <ul className="flex space-x-4">
                <li>
                    <a
                        href="/"
                        className={`hover:text-blue-300 ${pathname === '/' ? 'text-blue-300' : ''}`}
                    >
                        Home
                    </a>
                </li>
                <li>
                    <a
                        href="/protected"
                        className={`hover:text-blue-300 ${pathname === '/protected' ? 'text-blue-300' : ''}`}
                    >
                        Protected
                    </a>
                </li>
                <li>
                    <a
                        href="/protected/premium"
                        className={`hover:text-blue-300 ${pathname === '/protected/premium' ? 'text-blue-300' : ''}`}
                    >
                        Premium
                    </a>
                </li>
                <li>
                    {loading ? (
                        <span className="opacity-50">•••</span>
                    ) : (
                        !isAuthenticated && (
                            <a
                                href="/login"
                                className={`hover:text-blue-300 ${pathname === '/login' ? 'text-blue-300' : ''}`}
                            >
                                Login
                            </a>
                        )
                    )}
                </li>
            </ul>
        </nav>
    );
}
