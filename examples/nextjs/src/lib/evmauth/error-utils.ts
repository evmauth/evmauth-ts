import type { AcquisitionStep, ErrorResponseBody, PurchaseOption } from '@/types/evmauth';
import { logger } from './logger';
import { getTokenAcquisitionSteps, getTokenPurchaseOptions } from './token-utils';

/**
 * Error codes and their descriptions
 */
export const ERROR_CODES = {
    AUTH_MISSING: {
        code: 'AUTH_MISSING',
        message: 'Authentication required',
        status: 401,
        retryable: true,
    },
    AUTH_INVALID: {
        code: 'AUTH_INVALID',
        message: 'Invalid or expired authentication',
        status: 401,
        retryable: true,
    },
    TOKEN_MISSING: {
        code: 'TOKEN_MISSING',
        message: 'Required token not found',
        status: 403,
        retryable: true,
    },
    TOKEN_INSUFFICIENT: {
        code: 'TOKEN_INSUFFICIENT',
        message: 'Insufficient token balance',
        status: 403,
        retryable: true,
    },
    TOKEN_EXPIRED: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
        status: 403,
        retryable: true,
    },
    CONTRACT_ERROR: {
        code: 'CONTRACT_ERROR',
        message: 'Error communicating with blockchain',
        status: 500,
        retryable: true,
    },
    SERVER_ERROR: {
        code: 'SERVER_ERROR',
        message: 'Unexpected server error',
        status: 500,
        retryable: false,
    },
    INVALID_REQUEST: {
        code: 'INVALID_REQUEST',
        message: 'Invalid request parameters',
        status: 400,
        retryable: true,
    },
};

/**
 * Create a standardized error response body
 * @param errorCode The error code
 * @param options Additional options for the error response
 * @returns The error response body
 */
export function createErrorResponse(
    errorCode: keyof typeof ERROR_CODES,
    options?: {
        message?: string;
        operationId?: string;
        walletAddress?: string;
        tokenId?: number;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        details?: Record<string, any>;
    }
): ErrorResponseBody {
    // Get error details from error code
    const errorDetails = ERROR_CODES[errorCode];

    // Create base error response
    const errorResponse: ErrorResponseBody = {
        error: true,
        code: errorDetails.code,
        message: options?.message || errorDetails.message,
        retryable: errorDetails.retryable,
    };

    // Add operation ID if provided
    if (options?.operationId) {
        errorResponse.operationId = options.operationId;

        // Log the error
        logger.error({
            category: 'auth',
            message: `Auth error: ${errorResponse.code} - ${errorResponse.message}`,
            component: 'error-utils',
            operationId: options.operationId,
            data: {
                errorCode,
                walletAddress: options.walletAddress,
                tokenId: options.tokenId,
                ...options.details,
            },
        });
    }

    // Add resolution steps for token-related errors
    if (
        (errorCode === 'TOKEN_MISSING' ||
            errorCode === 'TOKEN_INSUFFICIENT' ||
            errorCode === 'TOKEN_EXPIRED') &&
        options?.tokenId !== undefined
    ) {
        const tokenId = options.tokenId;

        // Add resolution steps
        errorResponse.resolution = {
            cause: getErrorCause(errorCode, options),
            steps: getTokenAcquisitionSteps(tokenId, errorCode),
            purchaseOptions: getTokenPurchaseOptions(tokenId),
        };
    }

    return errorResponse;
}

/**
 * Get a human-readable cause for an error
 * @param errorCode The error code
 * @param options Additional context for the error
 * @returns A human-readable cause string
 */
function getErrorCause(
    errorCode: keyof typeof ERROR_CODES,
    options?: {
        walletAddress?: string;
        tokenId?: number;
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        details?: Record<string, any>;
    }
): string {
    const tokenId = options?.tokenId !== undefined ? options.tokenId : 0;

    switch (errorCode) {
        case 'AUTH_MISSING':
            return 'You need to authenticate to access this resource';

        case 'AUTH_INVALID':
            return 'Your authentication has expired or is invalid';

        case 'TOKEN_MISSING':
            return `You need to own token #${tokenId} to access this resource`;

        case 'TOKEN_INSUFFICIENT':
            return `You don't have enough of token #${tokenId} to access this resource`;

        case 'TOKEN_EXPIRED':
            return `Your token #${tokenId} has expired`;

        case 'CONTRACT_ERROR':
            return 'There was an error communicating with the blockchain';

        case 'SERVER_ERROR':
            return 'There was an unexpected server error';

        case 'INVALID_REQUEST':
            return 'Your request contains invalid parameters';

        default:
            return 'An error occurred';
    }
}
