import type { Address, Hash } from 'viem';
import { EVMAuthBaseClient } from './base.js';

/**
 * Client for ACCESS_MANAGER_ROLE holders
 * Provides methods for account freezing and contract pausing
 */
export class EVMAuthAccessManagerClient extends EVMAuthBaseClient {
    /**
     * Freeze an account, preventing it from transferring tokens
     * @param account The account to freeze
     * @returns The transaction hash
     */
    async freezeAccount(account: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.freezeAccount([account]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Freeze account transaction failed');
        }

        return hash;
    }

    /**
     * Unfreeze an account, allowing it to transfer tokens again
     * @param account The account to unfreeze
     * @returns The transaction hash
     */
    async unfreezeAccount(account: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.unfreezeAccount([account]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Unfreeze account transaction failed');
        }

        return hash;
    }

    /**
     * Check if an account is frozen
     * @param account The account to check
     * @returns True if the account is frozen
     */
    async isFrozen(account: Address): Promise<boolean> {
        return (await this.contract.read.isFrozen([account])) as boolean;
    }

    /**
     * Get all frozen accounts
     * @returns Array of frozen account addresses
     */
    async frozenAccounts(): Promise<readonly Address[]> {
        return (await this.contract.read.frozenAccounts()) as Address[];
    }

    /**
     * Pause the contract, preventing most operations
     * @returns The transaction hash
     */
    async pause(): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.pause();

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Pause contract transaction failed');
        }

        return hash;
    }

    /**
     * Unpause the contract, resuming normal operations
     * @returns The transaction hash
     */
    async unpause(): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.unpause();

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Unpause contract transaction failed');
        }

        return hash;
    }

    /**
     * Check if the contract is paused
     * @returns True if the contract is paused
     */
    async paused(): Promise<boolean> {
        return (await this.contract.read.paused()) as boolean;
    }

    /**
     * Get the frozen status constant
     * @returns The bytes32 frozen status identifier
     */
    async ACCOUNT_FROZEN_STATUS(): Promise<`0x${string}`> {
        return (await this.contract.read.ACCOUNT_FROZEN_STATUS()) as `0x${string}`;
    }

    /**
     * Get the unfrozen status constant
     * @returns The bytes32 unfrozen status identifier
     */
    async ACCOUNT_UNFROZEN_STATUS(): Promise<`0x${string}`> {
        return (await this.contract.read.ACCOUNT_UNFROZEN_STATUS()) as `0x${string}`;
    }
}
