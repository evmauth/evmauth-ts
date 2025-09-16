import type { Hash, TransactionReceipt } from 'viem';
import type { BurnBatchParams, BurnParams } from '../types.js';
import { EVMAuthBaseClient } from './base.js';

/**
 * Client for BURNER_ROLE holders
 * Provides methods for burning/revoking tokens
 */
export class EVMAuthBurnerClient extends EVMAuthBaseClient {
    /**
     * Burn tokens from a specific address
     * @param params Burning parameters
     * @returns The transaction hash
     */
    async burn(params: BurnParams): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.burn([params.from, params.tokenId, params.amount]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Burn transaction failed');
        }

        return hash;
    }

    /**
     * Burn multiple token types from a specific address
     * @param params Batch burning parameters
     * @returns The transaction hash (for ERC-1155) or array of hashes (for ERC-6909)
     */
    async burnBatch(params: BurnBatchParams): Promise<Hash | Hash[]> {
        this.ensureWriteCapability();

        if (params.tokenIds.length !== params.amounts.length) {
            throw new Error('Token IDs and amounts arrays must have the same length');
        }

        // For ERC-1155, use the batch burn function
        if (this.isERC1155) {
            const hash = await this.contract.write.burnBatch([
                params.from,
                params.tokenIds,
                params.amounts,
            ]);

            // Wait for the transaction receipt
            const receipt = await this.getTransactionReceipt(hash);
            if (receipt.status !== 'success') {
                throw new Error('Burn batch transaction failed');
            }

            return hash;
        }

        // For ERC-6909, burn each token type individually
        const burnTxs: Promise<Hash>[] = [];
        for (let i = 0; i < params.tokenIds.length; i++) {
            burnTxs.push(
                this.burn({
                    from: params.from,
                    tokenId: params.tokenIds[i],
                    amount: params.amounts[i],
                })
            );
        }
        const hashes = await Promise.all(burnTxs);

        // Wait for the transaction receipts
        const receiptTxs: Promise<TransactionReceipt>[] = [];
        for (const hash of hashes) {
            receiptTxs.push(this.getTransactionReceipt(hash));
        }

        // Check for any failed transactions
        const receipts = await Promise.all(receiptTxs);
        const failures = receipts.filter((r) => r.status !== 'success');
        if (failures.length > 0) {
            const failedHashes = failures
                .map((f: TransactionReceipt) => f.transactionHash)
                .join(', ');
            throw new Error(
                `${failures.length} of ${receipts.length} burn transactions failed: ${failedHashes}`
            );
        }

        return hashes;
    }
}
