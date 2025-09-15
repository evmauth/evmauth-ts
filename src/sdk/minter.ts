import type { Address, Hash } from 'viem';
import { BaseSDK } from './base.js';

export interface MintParams {
    to: Address;
    tokenId: bigint;
    amount: bigint;
}

export interface MintBatchParams {
    to: Address;
    tokenIds: readonly bigint[];
    amounts: readonly bigint[];
}

/**
 * SDK for MINTER_ROLE holders
 * Provides methods for minting tokens and managing balance records
 */
export class MinterSDK extends BaseSDK {
    /**
     * Mint tokens to a specific address
     * @param params Minting parameters
     * @returns The transaction hash
     */
    async mint(params: MintParams): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.mint([
            params.to,
            params.tokenId,
            params.amount,
        ]) as Promise<Hash>;
    }

    /**
     * Mint multiple token types to a specific address
     * @param params Batch minting parameters
     * @returns The transaction hash
     */
    async mintBatch(params: MintBatchParams): Promise<Hash> {
        this.ensureWriteCapability();

        if (params.tokenIds.length !== params.amounts.length) {
            throw new Error('Token IDs and amounts arrays must have the same length');
        }

        return this.contract.write.mintBatch([
            params.to,
            params.tokenIds,
            params.amounts,
        ]) as Promise<Hash>;
    }

    /**
     * Prune expired balance records for a specific account and token
     * This helps manage storage costs by removing expired records
     * @param account The account to prune records for
     * @param tokenId The token ID to prune records for
     * @returns The transaction hash
     */
    async pruneBalanceRecords(account: Address, tokenId: bigint): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.pruneBalanceRecords([account, tokenId]) as Promise<Hash>;
    }

    /**
     * Get the default maximum number of balance records
     * @returns The maximum number of balance records
     */
    async DEFAULT_MAX_BALANCE_RECORDS(): Promise<bigint> {
        return (await this.contract.read.DEFAULT_MAX_BALANCE_RECORDS()) as Promise<bigint>;
    }
}
