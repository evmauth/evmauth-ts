import type { Address, Hash, PublicClient } from 'viem';
import { BaseSDK } from './base.js';

export interface TokenConfig {
    price: bigint;
    ttl: bigint;
    transferable: boolean;
}

export interface CreateTokenParams {
    price: bigint;
    ttl: bigint;
    transferable: boolean;
    uri?: string;
}

export interface UpdateTokenParams {
    tokenId: bigint;
    price: bigint;
    ttl: bigint;
    transferable: boolean;
}

/**
 * SDK for TOKEN_MANAGER_ROLE holders
 * Provides methods for creating and configuring tokens
 */
export class TokenManagerSDK extends BaseSDK {
    /**
     * Create a new token with the specified configuration
     * @param params Token creation parameters
     * @returns Object containing transaction hash and a method to get token ID from receipt
     */
    async createToken(params: CreateTokenParams): Promise<{
        hash: Hash;
        getTokenId: (client: PublicClient) => Promise<bigint>;
    }> {
        this.ensureWriteCapability();

        // Create the config struct for the contract
        const config = {
            price: params.price,
            erc20Prices: [], // Empty array for now, can be extended later
            ttl: params.ttl,
            transferable: params.transferable,
        };

        const hash = (await this.contract.write.createToken([config])) as Hash;

        return {
            hash,
            getTokenId: async (client: PublicClient) => {
                const receipt = await client.getTransactionReceipt({ hash });
                return this.getTokenIdFromReceipt(receipt);
            },
        };
    }

    /**
     * Update an existing token's configuration
     * @param params Token update parameters
     * @returns The transaction hash
     */
    async updateToken(params: UpdateTokenParams): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.updateToken([
            params.tokenId,
            params.price,
            params.ttl,
            params.transferable,
        ]) as Promise<Hash>;
    }

    /**
     * Set the URI for a specific token
     * @param tokenId The token ID
     * @param uri The new URI
     * @returns The transaction hash
     */
    async setTokenURI(tokenId: bigint, uri: string): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.setTokenURI([tokenId, uri]) as Promise<Hash>;
    }

    /**
     * Set the base URI for all tokens
     * @param baseURI The new base URI
     * @returns The transaction hash
     */
    async setBaseURI(baseURI: string): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.setBaseURI([baseURI]) as Promise<Hash>;
    }

    /**
     * Get the configuration for a token
     * @param tokenId The token ID
     * @returns The token configuration
     */
    async tokenConfig(tokenId: bigint): Promise<TokenConfig> {
        const token = (await this.contract.read.tokenConfig([tokenId])) as {
            id: bigint;
            config: {
                price: bigint;
                erc20Prices: readonly unknown[];
                ttl: bigint;
                transferable: boolean;
            };
        };
        return {
            price: token.config.price,
            ttl: token.config.ttl,
            transferable: token.config.transferable,
        };
    }

    /**
     * Get the price of a token in native currency
     * @param tokenId The token ID
     * @returns The price in wei
     */
    async tokenPrice(tokenId: bigint): Promise<bigint> {
        return (await this.contract.read.tokenPrice([tokenId])) as Promise<bigint>;
    }

    /**
     * Get the time-to-live (TTL) for a token
     * @param tokenId The token ID
     * @returns The TTL in seconds
     */
    async tokenTTL(tokenId: bigint): Promise<bigint> {
        return (await this.contract.read.tokenTTL([tokenId])) as Promise<bigint>;
    }

    /**
     * Check if a token is transferable
     * @param tokenId The token ID
     * @returns True if the token is transferable
     */
    async isTransferable(tokenId: bigint): Promise<boolean> {
        return (await this.contract.read.isTransferable([tokenId])) as Promise<boolean>;
    }

    /**
     * Get the next token ID that will be created
     * @returns The next token ID
     */
    async nextTokenID(): Promise<bigint> {
        return (await this.contract.read.nextTokenID()) as Promise<bigint>;
    }

    /**
     * Check if a token exists
     * @param tokenId The token ID
     * @returns True if the token exists
     */
    async exists(tokenId: bigint): Promise<boolean> {
        return (await this.contract.read.exists([tokenId])) as Promise<boolean>;
    }

    /**
     * Get the URI for a token
     * @param tokenId The token ID
     * @returns The token URI
     */
    async uri(tokenId: bigint): Promise<string> {
        return (await this.contract.read.uri([tokenId])) as Promise<string>;
    }

    /**
     * Get the ERC20 token prices for a specific token
     * @param tokenId The token ID
     * @returns Array of [token address, price] tuples
     */
    async tokenERC20Prices(tokenId: bigint): Promise<readonly [Address, bigint][]> {
        return (await this.contract.read.tokenERC20Prices([tokenId])) as Promise<
            readonly [Address, bigint][]
        >;
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
        ])) as Promise<boolean>;
    }
}
