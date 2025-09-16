import type { Address, Hash, TransactionReceipt } from 'viem';
import type { EVMAuthToken, EVMAuthTokenConfig, PaymentToken } from '../types.js';
import { EVMAuthBaseClient } from './base.js';

/**
 * Client for TOKEN_MANAGER_ROLE holders
 * Provides methods for creating and configuring tokens
 */
export class EVMAuthTokenManagerClient extends EVMAuthBaseClient {
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
     * Create a new token with the specified configuration
     * @param params Token config parameters
     * @returns Object containing transaction hash and the created token ID
     */
    async createToken(params: EVMAuthTokenConfig): Promise<{
        hash: Hash;
        tokenId: bigint;
    }> {
        this.ensureWriteCapability();
        const hash = (await this.contract.write.createToken([params])) as Hash;

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Create token transaction failed');
        }

        // Extract the token ID from the receipt
        const tokenId = this.getTokenIdFromReceipt(receipt);

        return {
            hash,
            tokenId,
        };
    }

    /**
     * Update an existing token's configuration
     * @param tokenId The token ID to update
     * @param params Token config parameters
     * @returns The transaction hash
     */
    async updateToken(tokenId: bigint, params: EVMAuthTokenConfig): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.updateToken([tokenId, params]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Update token transaction failed');
        }

        return hash;
    }

    /**
     * Set the URI for a specific token
     * @param tokenId The token ID
     * @param uri The new URI
     * @returns The transaction hash
     */
    async setTokenURI(tokenId: bigint, uri: string): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.setTokenURI([tokenId, uri]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Set token URI transaction failed');
        }

        return hash;
    }

    /**
     * Set the base URI (ERC-1155) or contract URI (ERC-6909)
     * @param uri The new base/contract URI
     * @returns The transaction hash
     */
    async setBaseURI(uri: string): Promise<Hash> {
        this.ensureWriteCapability();

        let hash: Hash;

        if (this.isERC1155) {
            // For ERC-1155 this method sets the base URI
            hash = await this.contract.write.setBaseURI([uri]);
        } else {
            // For ERC-6909 this method sets the contract URI
            hash = await this.contract.write.setContractURI([uri]);
        }

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Set base token URI transaction failed');
        }

        return hash;
    }

    /**
     * Alias for setBaseURI, using the semantics of ERC-6909
     * @param uri The new contract URI
     * @returns The transaction hash
     */
    async setContractURI(uri: string): Promise<Hash> {
        return this.setBaseURI(uri);
    }

    /**
     * Get the configuration for a token
     * @param tokenId The token ID
     * @returns The token configuration
     */
    async tokenConfig(tokenId: bigint): Promise<EVMAuthToken> {
        return (await this.contract.read.tokenConfig([tokenId])) as EVMAuthToken;
    }

    /**
     * Get the price of a token in native currency
     * @param tokenId The token ID
     * @returns The price in wei
     */
    async tokenPrice(tokenId: bigint): Promise<bigint> {
        return (await this.contract.read.tokenPrice([tokenId])) as bigint;
    }

    /**
     * Get the time-to-live (TTL) for a token
     * @param tokenId The token ID
     * @returns The TTL in seconds
     */
    async tokenTTL(tokenId: bigint): Promise<bigint> {
        return (await this.contract.read.tokenTTL([tokenId])) as bigint;
    }

    /**
     * Check if a token is transferable
     * @param tokenId The token ID
     * @returns True if the token is transferable
     */
    async isTransferable(tokenId: bigint): Promise<boolean> {
        return (await this.contract.read.isTransferable([tokenId])) as boolean;
    }

    /**
     * Get the next token ID that will be created
     * @returns The next token ID
     */
    async nextTokenID(): Promise<bigint> {
        return (await this.contract.read.nextTokenID()) as bigint;
    }

    /**
     * Check if a token exists
     * @param tokenId The token ID
     * @returns True if the token exists
     */
    async exists(tokenId: bigint): Promise<boolean> {
        return (await this.contract.read.exists([tokenId])) as boolean;
    }

    /**
     * Get the URI for a token
     * @param tokenId The token ID
     * @returns The token URI
     */
    async uri(tokenId: bigint): Promise<string> {
        return (await this.contract.read.uri([tokenId])) as string;
    }

    /**
     * Get the ERC20 token prices for a specific token
     * @param tokenId The token ID
     * @returns Array of [token address, price] tuples
     */
    async tokenERC20Prices(tokenId: bigint): Promise<PaymentToken[]> {
        return (await this.contract.read.tokenERC20Prices([tokenId])) as PaymentToken[];
    }

    /**
     * Check if an ERC20 token is accepted as payment for a specific token
     * @param tokenId The token ID
     * @param paymentToken The ERC20 token address
     * @returns True if the payment token is accepted
     */
    async isAcceptedERC20PaymentToken(tokenId: bigint, paymentToken: Address): Promise<boolean> {
        return (await this.contract.read.isAcceptedERC20PaymentToken([
            tokenId,
            paymentToken,
        ])) as boolean;
    }
}
