/**
 * Type definitions for EVMAuth integration
 *
 * These definitions establish the contract between components and should be
 * implemented exactly as specified to ensure compatibility.
 */

/**
 * Authentication token payload structure
 * This defines what information is stored in the JWT token
 */
export interface AuthTokenPayload {
    /** The authenticated wallet address (required) */
    walletAddress: string;

    /** Timestamp when the token was issued in seconds (required) */
    issuedAt: number;

    /** Timestamp when the token expires in seconds (required) */
    expiresAt: number;

    /** Optional nonce for verification */
    nonce?: string;

    /** Optional flag indicating this is a demo wallet */
    demo?: boolean;
}

/**
 * Challenge request result
 * Returned when a user requests an authentication challenge
 */
export interface ChallengeResult {
    /** Whether challenge creation was successful */
    success: boolean;

    /** The challenge message to sign if successful */
    challenge?: string;

    /** The challenge nonce for verification */
    nonce?: string;

    /** Error message if challenge creation failed */
    error?: string;

    /** ISO timestamp when the challenge expires */
    expiresAt?: string;
}

/**
 * Authentication result
 * Returned when a user completes authentication
 */
export interface AuthResult {
    /** Whether authentication was successful */
    success: boolean;

    /** The JWT token if successful */
    token?: string;

    /** The authenticated wallet address if successful */
    walletAddress?: string;

    /** Error message if authentication failed */
    error?: string;

    /** Error code if authentication failed */
    errorCode?: string;
}

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

/**
 * Token metadata
 * Information about a token for display purposes
 */
export interface TokenMetadata {
    /** Token ID */
    id: number;

    /** Token name */
    name: string;

    /** Token description */
    description: string;

    /** Price in fiat currency */
    fiatPrice: number;

    /** Price in ETH */
    priceInEth?: number;

    /** Price in ETH wei as string (for BigInt conversion) */
    ethPriceWei?: string;

    /** Time to live in seconds */
    timeToLive: number;

    /** Whether the token is transferable */
    transferable: boolean;

    /** Whether token usage is metered */
    metered: boolean;

    /** Whether token is burned on use */
    burnedOnUse: boolean;
}

/**
 * Acquisition step
 * Step in the process of acquiring a token
 */
export interface AcquisitionStep {
    /** Step number */
    step: number;

    /** Action to take */
    action: 'authenticate' | 'purchase' | 'upgrade' | 'renew';

    /** Description of the step */
    description: string;
}

/**
 * Purchase option
 * Method for purchasing a token
 */
export interface PurchaseOption {
    /** Purchase method */
    method: 'crypto' | 'fiat' | 'dapp';

    /** Service provider */
    provider: string;

    /** URL or deep link for purchase */
    url: string;
}

/**
 * Error response body
 * Standardized error response format
 */
export interface ErrorResponseBody {
    /** Error occurred */
    error: true;

    /** Error code */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Whether the error is retryable */
    retryable: boolean;

    /** Steps to resolve the error */
    resolution?: {
        /** What caused the error */
        cause: string;

        /** Steps to fix the error */
        steps: AcquisitionStep[];

        /** Purchase options if applicable */
        purchaseOptions?: PurchaseOption[];
    };

    /** Operation ID for troubleshooting */
    operationId?: string;
}

/**
 * Log entry
 * Structure for standardized logging
 */
export interface LogEntry {
    /** Timestamp in ISO format */
    timestamp: string;

    /** Log level */
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical';

    /** Log category */
    category: 'system' | 'auth' | 'token' | 'middleware' | 'api' | 'client';

    /** Log message */
    message: string;

    /** Component that generated the log */
    component: string;

    /** Operation ID for request tracing */
    operationId?: string;

    /** Additional data */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    data?: Record<string, any>;
}

/**
 * Authentication state
 * Current state of user authentication
 */
export interface AuthState {
    /** Whether the user is authenticated */
    isAuthenticated: boolean;

    /** The wallet address if authenticated */
    walletAddress?: string;

    /** When the authentication expires */
    expiresAt?: number;

    /** Whether authentication is loading */
    loading: boolean;

    /** Error if authentication failed */
    error?: string;
}

/**
 * Wallet provider
 * Interface for wallet connection providers
 */
export interface WalletProvider {
    /** Provider name */
    name: string;

    /** Check if provider is available */
    isAvailable(): boolean;

    /** Connect to the wallet */
    connect(): Promise<string>;

    /** Sign a message */
    signMessage(message: string): Promise<string>;

    /** Get the connected wallet address */
    getAddress(): Promise<string>;

    /** Disconnect from the wallet */
    disconnect(): Promise<void>;
}
