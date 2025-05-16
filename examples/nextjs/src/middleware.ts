import { type NextRequest, NextResponse } from 'next/server';
import { initBlockchainService } from './lib/evmauth/blockchain';
import { validateConfig } from './lib/evmauth/config';
import { logger } from './lib/evmauth/logger';
import {
    createMiddlewareContext,
    createMiddlewareResponse,
    processAuth,
    shouldExcludePath,
} from './lib/evmauth/middleware-helpers';

/**
 * EVMAuth Next.js Middleware
 *
 * This middleware intercepts requests to protected routes and verifies:
 * 1. User authentication (JWT token)
 * 2. Token ownership (EVMAuth token balance)
 *
 * It redirects to authentication flow if the user is not authenticated
 * or to token purchase flow if the user doesn't have the required tokens.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
    try {
        // Initialize blockchain service on every request to ensure latest environment variables
        try {
            // Validate configuration
            const configValidation = validateConfig();
            if (!configValidation.isValid) {
                console.error('Invalid EVMAuth configuration:', configValidation.errors);
            } else {
                // Initialize blockchain service with latest environment variables
                await initBlockchainService();
            }
        } catch (error) {
            console.error('Error during EVMAuth initialization:', error);
        }

        // Create middleware context
        const context = createMiddlewareContext(request);
        const { pathname, operationId } = context;

        // Check if path should be excluded from middleware processing
        if (shouldExcludePath(pathname)) {
            logger.debug({
                category: 'middleware',
                message: `Skipping middleware for excluded path: ${pathname}`,
                component: 'middleware',
                operationId,
                data: { pathname },
            });

            return NextResponse.next();
        }

        // Process authentication and token validation
        const result = await processAuth(context);

        // Create response based on result
        return createMiddlewareResponse(result, request);
    } catch (error) {
        // Log unexpected errors
        console.error('Middleware error:', error);

        // Return internal server error
        return NextResponse.redirect(new URL('/error?code=SERVER_ERROR', request.url));
    }
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
    // Match all routes except static files
    matcher: [
        /*
         * Match all request paths except:
         * 1. /_next (Next.js internals)
         * 2. /favicon.ico, /robots.txt, etc. (static files)
         * 3. /public (static assets)
         * 4. /_vercel (Vercel internals)
         */
        '/((?!_next|_vercel|favicon\\.ico|robots\\.txt|public).*)',
    ],
};
