import type { Address, Hash, TransactionReceipt } from 'viem';
import type { MintBatchParams, MintParams } from '../types.js';
import { EVMAuthBaseClient } from './base.js';

/**
 * Client for MINTER_ROLE holders
 * Provides methods for minting tokens and managing balance records
 */
export class EVMAuthMinterClient extends EVMAuthBaseClient {
    /**
     * Mint tokens to a specific address
     * @param params Minting parameters
     * @returns The transaction hash
     */
    async mint(params: MintParams): Promise<Hash> {
        this.ensureWriteCapability();

        let hash: Hash;

        // For ERC-1155, include the data parameter (default to '0x' if not provided)
        if (this.isERC1155) {
            hash = await this.contract.write.mint([
                params.to,
                params.tokenId,
                params.amount,
                params.data ?? '0x',
            ]);
        } else {
            // For ERC-6909, data parameter is not used
            hash = await this.contract.write.mint([params.to, params.tokenId, params.amount]);
        }

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Mint transaction failed');
        }

        return hash;
    }

    /**
     * Mint multiple token types to a specific address
     * @param params Batch minting parameters
     * @returns An array containing the transaction hash(es)
     */
    async mintBatch(params: MintBatchParams): Promise<Hash[]> {
        this.ensureWriteCapability();

        if (params.tokenIds.length !== params.amounts.length) {
            throw new Error('Token IDs and amounts arrays must have the same length');
        }

        const hashes: Hash[] = [];

        // For ERC-1155, include the data parameter (default to '0x' if not provided)
        if (this.isERC1155) {
            const hash = await this.contract.write.mintBatch([
                params.to,
                params.tokenIds,
                params.amounts,
                params.data ?? '0x',
            ]);
            hashes.push(hash);

            // Wait for the transaction receipt
            const receipt = await this.getTransactionReceipt(hash);
            if (receipt.status !== 'success') {
                throw new Error('Mint batch transaction failed');
            }

            return hashes;
        }

        // For ERC-6909, mint each token type individually
        const receiptTxs: Promise<TransactionReceipt>[] = [];
        for (let i = 0; i < params.tokenIds.length; i++) {
            const hash = await this.mint({
                to: params.to,
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
                `${failures.length} of ${receipts.length} mint transactions failed: ${failedHashes}`
            );
        }

        return hashes;
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
        const hash = await this.contract.write.pruneBalanceRecords([account, tokenId]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Prune balance transaction failed');
        }

        return hash;
    }

    /**
     * Get the default maximum number of balance records
     * @returns The maximum number of balance records
     */
    async DEFAULT_MAX_BALANCE_RECORDS(): Promise<bigint> {
        return (await this.contract.read.DEFAULT_MAX_BALANCE_RECORDS()) as Promise<bigint>;
    }
}
