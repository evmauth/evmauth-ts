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
     * @returns An array containing the transaction hash(es)
     */
    async burnBatch(params: BurnBatchParams): Promise<Hash[]> {
        this.ensureWriteCapability();

        if (params.tokenIds.length !== params.amounts.length) {
            throw new Error('Token IDs and amounts arrays must have the same length');
        }

        const hashes: Hash[] = [];

        // For ERC-1155, use the batch burn function
        if (this.isERC1155) {
            const hash = await this.contract.write.burnBatch([
                params.from,
                params.tokenIds,
                params.amounts,
            ]);
            hashes.push(hash);

            // Wait for the transaction receipt
            const receipt = await this.getTransactionReceipt(hash);
            if (receipt.status !== 'success') {
                throw new Error('Burn batch transaction failed');
            }

            return hashes;
        }

        // For ERC-6909, burn each token type individually
        const receiptTxs: Promise<TransactionReceipt>[] = [];
        for (let i = 0; i < params.tokenIds.length; i++) {
            const hash = await this.burn({
                from: params.from,
                tokenId: params.tokenIds[i],
                amount: params.amounts[i],
            });
            hashes.push(hash);
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
