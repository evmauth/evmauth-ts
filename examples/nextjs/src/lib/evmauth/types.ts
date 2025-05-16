/**
 * Token requirement definition
 * Defines what tokens are required for a specific resource
 */
export interface TokenRequirement {
    /** The ID of the token required for access */
    tokenId: number;

    /** The amount of tokens required for access */
    amount: number;
}

/**
 * Token validation result
 * Returned when validating if a user has the required tokens
 */
export interface TokenValidationResult {
    /** Whether token validation was successful */
    isValid: boolean;

    /** The wallet address that was validated */
    walletAddress?: string;

    /** The token ID that was checked */
    tokenId?: number;

    /** The required token amount */
    requiredAmount?: number;

    /** The actual token balance */
    actualBalance?: bigint;

    /** Error code if validation failed */
    errorCode?: string;

    /** Human-readable error message */
    message?: string;

    /** Whether the error is retryable */
    retryable?: boolean;
}

/**
 * Middleware context
 * Passed to middleware helpers for processing
 */
export interface MiddlewareContext {
    /** The request object */
    req: Request;

    /** The URL of the request */
    url: URL;

    /** The pathname being accessed */
    pathname: string;

    /** Whether this is an API route */
    isApiRoute: boolean;

    /** Whether this path is protected */
    isProtectedPath: boolean;

    /** The token requirement for this path */
    tokenRequirement?: TokenRequirement;

    /** Operation ID for request tracing */
    operationId: string;
}

/**
 * Middleware result
 * Returned from middleware processing
 */
export interface MiddlewareResult {
    /** Whether the user is authenticated and has required tokens */
    isAuthenticated: boolean;

    /** The wallet address if authenticated */
    walletAddress?: string;

    /** Error information if not authenticated */
    error?: {
        /** Error type code */
        code: string;

        /** Human-readable error message */
        message: string;

        /** HTTP status code */
        status: number;

        /** Whether the error is retryable */
        retryable: boolean;

        /** Additional error details */
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        details?: Record<string, any>;
    };

    /** Response to return, if any */
    response?: Response;
}
