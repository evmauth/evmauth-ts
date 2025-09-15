import type {
    Address,
    GetContractReturnType,
    PublicClient,
    TransactionReceipt,
    WalletClient,
} from 'viem';
import type { evmAuth1155Abi, evmAuth6909Abi } from '../abis/index.js';

export type EVMAuth1155Contract = GetContractReturnType<
    typeof evmAuth1155Abi,
    PublicClient | WalletClient
>;

export type EVMAuth6909Contract = GetContractReturnType<
    typeof evmAuth6909Abi,
    PublicClient | WalletClient
>;

export type EVMAuthContract = EVMAuth1155Contract | EVMAuth6909Contract;

/**
 * Base SDK class that provides common functionality for all role-specific SDKs
 */
export abstract class BaseSDK {
    protected readonly contract: EVMAuthContract;
    protected readonly isWalletClient: boolean;

    constructor(contract: EVMAuthContract, isWalletClient = true) {
        this.contract = contract;
        // Explicitly track if this is a wallet client with write capabilities
        this.isWalletClient = isWalletClient;
    }

    /**
     * Get the contract address
     */
    get address(): Address {
        return this.contract.address;
    }

    /**
     * Get the underlying contract instance
     */
    getContract(): EVMAuthContract {
        return this.contract;
    }

    /**
     * Check if the SDK has write capabilities
     */
    canWrite(): boolean {
        return this.isWalletClient;
    }

    /**
     * Extract token ID from a token creation transaction receipt
     * @param receipt The transaction receipt from createToken
     * @returns The created token ID
     */
    protected getTokenIdFromReceipt(receipt: TransactionReceipt): bigint {
        // Look for EVMAuthTokenConfigured event in the logs
        for (const log of receipt.logs) {
            // The event signature for EVMAuthTokenConfigured
            // First topic is the event signature hash
            if (log.topics.length > 1 && log.topics[1]) {
                try {
                    // Token ID is the first indexed parameter (second topic)
                    return BigInt(log.topics[1]);
                } catch {
                    // Continue to next log if this isn't the right event
                }
            }
        }

        throw new Error('Failed to extract token ID from transaction receipt');
    }

    /**
     * Ensure the SDK has write capabilities
     * @throws Error if the SDK is read-only
     */
    protected ensureWriteCapability(): void {
        if (!this.canWrite()) {
            throw new Error(
                'This SDK instance is read-only. Use a WalletClient to perform write operations.'
            );
        }
    }
}
