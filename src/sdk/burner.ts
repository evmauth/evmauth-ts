import type { Address, Hash } from 'viem';
import { BaseSDK } from './base.js';

export interface BurnParams {
    from: Address;
    tokenId: bigint;
    amount: bigint;
}

export interface BurnBatchParams {
    from: Address;
    tokenIds: readonly bigint[];
    amounts: readonly bigint[];
}

/**
 * SDK for BURNER_ROLE holders
 * Provides methods for burning/revoking tokens
 */
export class BurnerSDK extends BaseSDK {
    /**
     * Burn tokens from a specific address
     * @param params Burning parameters
     * @returns The transaction hash
     */
    async burn(params: BurnParams): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.burn([
            params.from,
            params.tokenId,
            params.amount,
        ]) as Promise<Hash>;
    }

    /**
     * Burn multiple token types from a specific address
     * @param params Batch burning parameters
     * @returns The transaction hash
     */
    async burnBatch(params: BurnBatchParams): Promise<Hash> {
        this.ensureWriteCapability();

        if (params.tokenIds.length !== params.amounts.length) {
            throw new Error('Token IDs and amounts arrays must have the same length');
        }

        return this.contract.write.burnBatch([
            params.from,
            params.tokenIds,
            params.amounts,
        ]) as Promise<Hash>;
    }

    /**
     * Revoke tokens from an address (alias for burn)
     * @param from The address to revoke tokens from
     * @param tokenId The token ID to revoke
     * @param amount The amount to revoke
     * @returns The transaction hash
     */
    async revoke(from: Address, tokenId: bigint, amount: bigint): Promise<Hash> {
        return this.burn({ from, tokenId, amount });
    }

    /**
     * Revoke multiple token types from an address (alias for burnBatch)
     * @param from The address to revoke tokens from
     * @param tokenIds Array of token IDs to revoke
     * @param amounts Array of amounts to revoke
     * @returns The transaction hash
     */
    async revokeBatch(
        from: Address,
        tokenIds: readonly bigint[],
        amounts: readonly bigint[]
    ): Promise<Hash> {
        return this.burnBatch({ from, tokenIds, amounts });
    }
}
