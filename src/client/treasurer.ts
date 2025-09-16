import type { Address, Hash } from 'viem';
import { EVMAuthBaseClient } from './base.js';

/**
 * Client for TREASURER_ROLE holders
 * Provides methods for managing the treasury address
 */
export class EVMAuthTreasurerClient extends EVMAuthBaseClient {
    /**
     * Set the treasury address where funds are sent
     * @param newTreasury The new treasury address
     * @returns The transaction hash
     */
    async setTreasury(newTreasury: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.setTreasury([newTreasury]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Set treasury transaction failed');
        }

        return hash;
    }

    /**
     * Get the current treasury address
     * @returns The treasury address
     */
    async treasury(): Promise<Address> {
        return (await this.contract.read.treasury()) as Address;
    }
}
