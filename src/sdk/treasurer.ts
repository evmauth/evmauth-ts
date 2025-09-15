import type { Address, Hash } from 'viem';
import { BaseSDK } from './base.js';

/**
 * SDK for TREASURER_ROLE holders
 * Provides methods for managing the treasury address
 */
export class TreasurerSDK extends BaseSDK {
    /**
     * Set the treasury address where funds are sent
     * @param newTreasury The new treasury address
     * @returns The transaction hash
     */
    async setTreasury(newTreasury: Address): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.setTreasury([newTreasury]) as Promise<Hash>;
    }

    /**
     * Get the current treasury address
     * @returns The treasury address
     */
    async treasury(): Promise<Address> {
        return (await this.contract.read.treasury()) as Promise<Address>;
    }

    /**
     * Update the treasury address (alias for setTreasury)
     * @param newTreasury The new treasury address
     * @returns The transaction hash
     */
    async updateTreasury(newTreasury: Address): Promise<Hash> {
        return this.setTreasury(newTreasury);
    }

    /**
     * Get the current treasury address (alias for treasury)
     * @returns The treasury address
     */
    async getTreasury(): Promise<Address> {
        return this.treasury();
    }
}
