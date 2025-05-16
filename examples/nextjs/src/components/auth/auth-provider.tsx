'use client';

import { useEffect } from 'react';

/**
 * Auth Provider Component
 *
 * Handles client-side auth token management and ensures tokens
 * from localStorage are sent with each request as a fallback
 * when cookies aren't working correctly.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Add a fetch interceptor to include the token in the headers
        const originalFetch = window.fetch;
        window.fetch = async (input, init) => {
            // Get the token from localStorage
            const token = localStorage.getItem('evmauth_token');

            // Create a new init object to avoid reassigning the parameter
            let newInit = init;

            if (token) {
                // Clone the headers
                const headers = new Headers(init?.headers || {});

                // Add the token to the headers
                headers.set('X-Auth-Token', token);

                // Create a new init object instead of modifying the original
                newInit = { ...(init || {}), headers };
            }

            // Call the original fetch
            return originalFetch(input, newInit);
        };

        // Clean up
        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    return <>{children}</>;
}
