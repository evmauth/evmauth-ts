import type { MiddlewareContext, MiddlewareResult } from '@/types/evmauth';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';
import { getTokenRequirementForPath, isAuthPath, isProtectedPath, isStaticPath } from './config';
import { extractAuthToken, verifyAuthToken } from './jwt-utils';
import { logger } from './logger';
import { createApiErrorResponse, createPageErrorRedirect } from './response-utils';
import { validateToken } from './token-validator';

/**
 * Create a middleware context from a request
 * @param req The request object
 * @returns The middleware context
 */
export function createMiddlewareContext(req: Request): MiddlewareContext {
    // Parse the URL
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Generate an operation ID for request tracing
    const operationId = nanoid();

    // Determine if this is an API route
    const isApiRoute = pathname.startsWith('/api/');

    // Determine if this is a protected path
    const isProtected = isProtectedPath(pathname);

    // Get token requirement for path
    const tokenRequirement = isProtected ? getTokenRequirementForPath(pathname) : undefined;

    // Log middleware request
    logger.info({
        category: 'middleware',
        message: `Middleware processing request: ${pathname}`,
        component: 'middleware-helpers',
        operationId,
        data: {
            pathname,
            isApiRoute,
            isProtected,
            tokenRequirement,
            method: req.method,
        },
    });

    // Return context
    return {
        req,
        url,
        pathname,
        isApiRoute,
        isProtectedPath: isProtected,
        tokenRequirement,
        operationId,
    };
}

/**
 * Check if a path should be excluded from middleware processing
 * @param pathname The path to check
 * @returns True if the path should be excluded
 */
export function shouldExcludePath(pathname: string): boolean {
    // Skip static files, auth paths, and other excluded paths
    return isStaticPath(pathname) || isAuthPath(pathname);
}

/**
 * Process authentication and token validation
 * @param context The middleware context
 * @returns The middleware result
 */
export async function processAuth(context: MiddlewareContext): Promise<MiddlewareResult> {
    const { req, pathname, isApiRoute, isProtectedPath, tokenRequirement, operationId } = context;

    // Skip middleware processing for non-protected paths
    if (!isProtectedPath) {
        logger.debug({
            category: 'middleware',
            message: `Skipping auth for non-protected path: ${pathname}`,
            component: 'middleware-helpers',
            operationId,
            data: { pathname },
        });

        return { isAuthenticated: true };
    }

    // Extract JWT token from request
    const token = extractAuthToken(req);

    // If no token is present, return unauthorized
    if (!token) {
        logger.warn({
            category: 'middleware',
            message: `No auth token found for protected path: ${pathname}`,
            component: 'middleware-helpers',
            operationId,
            data: { pathname },
        });

        // Create error response based on route type
        const response = isApiRoute
            ? createApiErrorResponse('AUTH_MISSING', { operationId, pathname })
            : createPageErrorRedirect('AUTH_MISSING', {
                  operationId,
                  pathname,
                  originalUrl: req.url,
              });

        return {
            isAuthenticated: false,
            error: {
                code: 'AUTH_MISSING',
                message: 'Authentication required',
                status: 401,
                retryable: true,
            },
            response,
        };
    }

    // Verify JWT token
    const authPayload = await verifyAuthToken(token);

    // If token is invalid, return unauthorized
    if (!authPayload) {
        logger.warn({
            category: 'middleware',
            message: `Invalid auth token for protected path: ${pathname}`,
            component: 'middleware-helpers',
            operationId,
            data: { pathname },
        });

        // Create error response based on route type
        const response = isApiRoute
            ? createApiErrorResponse('AUTH_INVALID', { operationId, pathname })
            : createPageErrorRedirect('AUTH_INVALID', {
                  operationId,
                  pathname,
                  originalUrl: req.url,
              });

        return {
            isAuthenticated: false,
            error: {
                code: 'AUTH_INVALID',
                message: 'Invalid or expired authentication',
                status: 401,
                retryable: true,
            },
            response,
        };
    }

    // User is authenticated, get wallet address
    const walletAddress = authPayload.walletAddress;

    // If path requires tokens, validate token ownership
    if (tokenRequirement) {
        // Validate token requirement
        const validationResult = await validateToken(walletAddress, tokenRequirement, operationId);

        // If validation failed, return forbidden
        if (!validationResult.isValid) {
            // Create error response based on route type
            const response = isApiRoute
                ? // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                  createApiErrorResponse(validationResult.errorCode as any, {
                      operationId,
                      pathname,
                      walletAddress,
                      message: validationResult.message,
                      details: {
                          tokenId: validationResult.tokenId,
                          requiredAmount: validationResult.requiredAmount,
                          actualBalance: validationResult.actualBalance?.toString(),
                      },
                  })
                : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                  createPageErrorRedirect(validationResult.errorCode as any, {
                      operationId,
                      pathname,
                      walletAddress,
                      message: validationResult.message,
                      originalUrl: req.url,
                  });

            return {
                isAuthenticated: false,
                walletAddress,
                error: {
                    code: validationResult.errorCode || 'TOKEN_MISSING',
                    message: validationResult.message || 'Token validation failed',
                    status: 403,
                    retryable: validationResult.retryable ?? true,
                    details: {
                        tokenId: validationResult.tokenId,
                        requiredAmount: validationResult.requiredAmount,
                        actualBalance: validationResult.actualBalance?.toString(),
                    },
                },
                response,
            };
        }
    }

    // Authentication and token validation passed
    logger.info({
        category: 'middleware',
        message: `Auth successful for ${walletAddress} on ${pathname}`,
        component: 'middleware-helpers',
        operationId,
        data: {
            walletAddress,
            pathname,
            tokenRequirement,
        },
    });

    // Return success result
    return {
        isAuthenticated: true,
        walletAddress,
    };
}

/**
 * Create a Next.js response based on middleware result
 * @param result The middleware result
 * @param req The original request
 * @returns The Next.js response
 */
export function createMiddlewareResponse(result: MiddlewareResult, req: Request): NextResponse {
    // If there's a specific response in the result, return it
    if (result.response) {
        // Instead of creating a new Response, return the exact response object
        return result.response as unknown as NextResponse;
    }

    // If authentication succeeded, continue with wallet address in header
    if (result.isAuthenticated) {
        const response = NextResponse.next();

        // Add wallet address to headers if available
        if (result.walletAddress) {
            // Cannot modify the original request headers, so use request headers for next middleware
            response.headers.set('x-wallet-address', result.walletAddress);
        }

        return response;
    }

    // Default to unauthorized response
    return NextResponse.redirect(new URL('/login', req.url));
}
