import type { Address, Hash } from 'viem';
import { BaseSDK } from './base.js';

export interface BalanceRecord {
    amount: bigint;
    expiresAt: bigint;
}

export interface TransferParams {
    from: Address;
    to: Address;
    tokenId: bigint;
    amount: bigint;
    data?: `0x${string}`;
}

export interface BatchTransferParams {
    from: Address;
    to: Address;
    tokenIds: readonly bigint[];
    amounts: readonly bigint[];
    data?: `0x${string}`;
}

/**
 * SDK for public/external functionality
 * Provides methods for purchasing, transferring, and querying tokens
 */
export class ClientSDK extends BaseSDK {
    /**
     * Purchase tokens with native currency
     * @param tokenId The token ID to purchase
     * @param amount The amount of tokens to purchase
     * @returns The transaction hash
     */
    async purchaseWithNative(tokenId: bigint, amount: bigint): Promise<Hash> {
        this.ensureWriteCapability();
        const price = await this.tokenPrice(tokenId);
        const totalCost = price * amount;
        return this.contract.write.purchase([tokenId, amount], {
            value: totalCost,
        }) as Promise<Hash>;
    }

    /**
     * Purchase tokens for another address with native currency
     * @param receiver The address to receive the tokens
     * @param tokenId The token ID to purchase
     * @param amount The amount of tokens to purchase
     * @returns The transaction hash
     */
    async purchaseForWithNative(receiver: Address, tokenId: bigint, amount: bigint): Promise<Hash> {
        this.ensureWriteCapability();
        const price = await this.tokenPrice(tokenId);
        const totalCost = price * amount;
        return this.contract.write.purchaseFor([receiver, tokenId, amount], {
            value: totalCost,
        }) as Promise<Hash>;
    }

    /**
     * Purchase tokens with an ERC20 token
     * @param tokenId The token ID to purchase
     * @param amount The amount of tokens to purchase
     * @param paymentToken The ERC20 token address to use for payment
     * @returns The transaction hash
     */
    async purchaseWithERC20(tokenId: bigint, amount: bigint, paymentToken: Address): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.purchaseWithERC20([
            tokenId,
            amount,
            paymentToken,
        ]) as Promise<Hash>;
    }

    /**
     * Purchase tokens for another address with an ERC20 token
     * @param receiver The address to receive the tokens
     * @param tokenId The token ID to purchase
     * @param amount The amount of tokens to purchase
     * @param paymentToken The ERC20 token address to use for payment
     * @returns The transaction hash
     */
    async purchaseWithERC20For(
        receiver: Address,
        tokenId: bigint,
        amount: bigint,
        paymentToken: Address
    ): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.purchaseWithERC20For([
            receiver,
            tokenId,
            amount,
            paymentToken,
        ]) as Promise<Hash>;
    }

    /**
     * Get the balance of an account for a specific token
     * @param account The account to query
     * @param tokenId The token ID
     * @returns The balance amount
     */
    async balanceOf(account: Address, tokenId: bigint): Promise<bigint> {
        return (await this.contract.read.balanceOf([account, tokenId])) as Promise<bigint>;
    }

    /**
     * Get balances for multiple token types
     * @param accounts Array of accounts to query
     * @param tokenIds Array of token IDs
     * @returns Array of balance amounts
     */
    async balanceOfBatch(
        accounts: readonly Address[],
        tokenIds: readonly bigint[]
    ): Promise<readonly bigint[]> {
        if (accounts.length !== tokenIds.length) {
            throw new Error('Accounts and token IDs arrays must have the same length');
        }
        return (await this.contract.read.balanceOfBatch([accounts, tokenIds])) as Promise<
            readonly bigint[]
        >;
    }

    /**
     * Get detailed balance records for an account and token
     * @param account The account to query
     * @param tokenId The token ID
     * @returns Array of balance records with amounts and expiration times
     */
    async balanceRecordsOf(account: Address, tokenId: bigint): Promise<readonly BalanceRecord[]> {
        const records = (await this.contract.read.balanceRecordsOf([
            account,
            tokenId,
        ])) as readonly { amount: bigint; expiresAt: bigint }[];

        return records.map((record) => ({
            amount: record.amount,
            expiresAt: record.expiresAt,
        }));
    }

    /**
     * Check if a user has sufficient active balance for a time-gated action
     * @param account The account to check
     * @param tokenId The token ID
     * @param requiredAmount The minimum amount required
     * @returns True if the account has sufficient active balance
     */
    async hasActiveBalance(
        account: Address,
        tokenId: bigint,
        requiredAmount: bigint
    ): Promise<boolean> {
        const balance = await this.balanceOf(account, tokenId);
        return balance >= requiredAmount;
    }

    /**
     * Transfer tokens safely
     * @param params Transfer parameters
     * @returns The transaction hash
     */
    async safeTransferFrom(params: TransferParams): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.safeTransferFrom([
            params.from,
            params.to,
            params.tokenId,
            params.amount,
            params.data ?? '0x',
        ]) as Promise<Hash>;
    }

    /**
     * Transfer multiple token types safely
     * @param params Batch transfer parameters
     * @returns The transaction hash
     */
    async safeBatchTransferFrom(params: BatchTransferParams): Promise<Hash> {
        this.ensureWriteCapability();

        if (params.tokenIds.length !== params.amounts.length) {
            throw new Error('Token IDs and amounts arrays must have the same length');
        }

        return this.contract.write.safeBatchTransferFrom([
            params.from,
            params.to,
            params.tokenIds,
            params.amounts,
            params.data ?? '0x',
        ]) as Promise<Hash>;
    }

    /**
     * Set approval for an operator to manage all tokens
     * @param operator The operator address
     * @param approved Whether to approve or revoke
     * @returns The transaction hash
     */
    async setApprovalForAll(operator: Address, approved: boolean): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.setApprovalForAll([operator, approved]) as Promise<Hash>;
    }

    /**
     * Check if an operator is approved to manage all tokens for an account
     * @param account The account that granted approval
     * @param operator The operator to check
     * @returns True if the operator is approved
     */
    async isApprovedForAll(account: Address, operator: Address): Promise<boolean> {
        return (await this.contract.read.isApprovedForAll([account, operator])) as Promise<boolean>;
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
     * Get the next token ID that will be created
     * @returns The next token ID
     */
    async nextTokenID(): Promise<bigint> {
        return (await this.contract.read.nextTokenID()) as Promise<bigint>;
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
     * Check if a token is purchasable with a specific ERC20 token
     * @param tokenId The token ID
     * @param paymentToken The ERC20 payment token address
     * @returns True if the payment token is accepted
     */
    async canPurchaseWithERC20(tokenId: bigint, paymentToken: Address): Promise<boolean> {
        return (await this.contract.read.isAcceptedERC20PaymentToken([
            tokenId,
            paymentToken,
        ])) as Promise<boolean>;
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
     * Check if the contract supports a specific interface
     * @param interfaceId The interface ID to check
     * @returns True if the interface is supported
     */
    async supportsInterface(interfaceId: `0x${string}`): Promise<boolean> {
        return (await this.contract.read.supportsInterface([interfaceId])) as Promise<boolean>;
    }

    /**
     * Get the current owner of the contract
     * @returns The owner address
     */
    async owner(): Promise<Address> {
        return (await this.contract.read.owner()) as Promise<Address>;
    }
}
