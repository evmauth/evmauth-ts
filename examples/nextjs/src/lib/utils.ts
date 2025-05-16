/**
 * Interface for payment required details
 */
export interface PaymentDetails {
    isPaymentRequired: boolean;
    message: string;
    contractAddress?: string;
    networkId?: string;
    tokenId?: number;
    amount?: number;
    error?: string;
}

/**
 * Check if the response is a payment required error
 */
export function isPaymentRequiredError(response: Response): boolean {
    return response.status === 402;
}

/**
 * Parse a payment required error response
 */
export async function parsePaymentRequiredError(response: Response): Promise<PaymentDetails> {
    try {
        const data = await response.json();
        return {
            isPaymentRequired: true,
            message: data.message || 'Payment required to access this content',
            contractAddress: data.details?.contractAddress,
            networkId: data.details?.networkId,
            tokenId: data.details?.tokenId,
            amount: data.details?.amount,
        };
    } catch (_error) {
        return {
            isPaymentRequired: true,
            message: 'Payment required to access this content',
            error: 'Failed to parse payment details',
        };
    }
}