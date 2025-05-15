import type { ErrorResponseBody } from '@/types/evmauth';
import { NextResponse } from 'next/server';
import { getTokenRequirementForPath } from './config';
import { createErrorResponse } from './error-utils';
import { logger } from './logger';

/**
 * Create an unauthorized response for API routes
 * @param errorCode The error code
 * @param options Additional options for the error response
 * @returns NextResponse with error body
 */
export function createApiErrorResponse(
    errorCode: keyof typeof import('./error-utils').ERROR_CODES,
    options?: {
        message?: string;
        operationId?: string;
        walletAddress?: string;
        pathname?: string;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        details?: Record<string, any>;
    }
): NextResponse {
    // Get token requirement for path if pathname is provided
    let tokenId: number | undefined;
    if (options?.pathname) {
        const tokenRequirement = getTokenRequirementForPath(options.pathname);
        tokenId = tokenRequirement.tokenId;
    }

    // Create error response body
    const errorResponse = createErrorResponse(errorCode, {
        ...options,
        tokenId,
    });

    // Log the error
    if (options?.operationId) {
        logger.error({
            category: 'api',
            message: `API error response: ${errorResponse.code} - ${errorResponse.message}`,
            component: 'response-utils',
            operationId: options.operationId,
            data: {
                errorCode,
                pathname: options?.pathname,
                walletAddress: options?.walletAddress,
                ...options?.details,
            },
        });
    }

    // Return JSON response
    return NextResponse.json(
        errorResponse,
        { status: 401 } // Default to 401, will be overridden by real status code
    );
}

/**
 * Create a redirect response for page routes
 * @param errorCode The error code
 * @param options Additional options for the error response
 * @returns NextResponse redirect
 */
export function createPageErrorRedirect(
    errorCode: keyof typeof import('./error-utils').ERROR_CODES,
    options?: {
        message?: string;
        operationId?: string;
        walletAddress?: string;
        pathname?: string;
        originalUrl?: string;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        details?: Record<string, any>;
    }
): NextResponse {
    // Get token requirement for path if pathname is provided
    let tokenId: number | undefined;
    if (options?.pathname) {
        const tokenRequirement = getTokenRequirementForPath(options.pathname);
        tokenId = tokenRequirement.tokenId;
    }

    // Log the error
    if (options?.operationId) {
        logger.error({
            category: 'middleware',
            message: `Redirect due to error: ${errorCode}`,
            component: 'response-utils',
            operationId: options.operationId,
            data: {
                errorCode,
                pathname: options?.pathname,
                walletAddress: options?.walletAddress,
                tokenId,
                ...options?.details,
            },
        });
    }

    // Determine redirect URL based on error code
    let redirectUrl: string;

    switch (errorCode) {
        case 'AUTH_MISSING':
        case 'AUTH_INVALID': {
            redirectUrl = '/login';
            break;
        }

        case 'TOKEN_MISSING':
        case 'TOKEN_INSUFFICIENT':
        case 'TOKEN_EXPIRED': {
            redirectUrl = `/token-required?tokenId=${tokenId || 0}&error=${errorCode}`;
            if (options?.message) {
                redirectUrl += `&message=${encodeURIComponent(options.message)}`;
            }
            break;
        }

        default: {
            redirectUrl = `/error?code=${errorCode}`;
            if (options?.message) {
                redirectUrl += `&message=${encodeURIComponent(options.message)}`;
            }
            break;
        }
    }

    // Add return URL if pathname provided
    if (options?.pathname) {
        // Use '?' if no query parameters exist yet, otherwise use '&'
        const separator = redirectUrl.includes('?') ? '&' : '?';
        redirectUrl += `${separator}returnUrl=${encodeURIComponent(options.pathname)}`;
    }

    // Return redirect response
    // Use originalUrl if provided, otherwise default to localhost with default Next.js port
    const baseUrl = options?.originalUrl || 'http://localhost:3000';
    return NextResponse.redirect(new URL(redirectUrl, baseUrl));
}
