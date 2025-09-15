import type { Address, Hash } from 'viem';
import { BaseSDK } from './base.js';

/**
 * SDK for ACCESS_MANAGER_ROLE holders
 * Provides methods for account freezing and contract pausing
 */
export class AccessManagerSDK extends BaseSDK {
    /**
     * Freeze an account, preventing it from transferring tokens
     * @param account The account to freeze
     * @returns The transaction hash
     */
    async freezeAccount(account: Address): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.freezeAccount([account]) as Promise<Hash>;
    }

    /**
     * Unfreeze an account, allowing it to transfer tokens again
     * @param account The account to unfreeze
     * @returns The transaction hash
     */
    async unfreezeAccount(account: Address): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.unfreezeAccount([account]) as Promise<Hash>;
    }

    /**
     * Check if an account is frozen
     * @param account The account to check
     * @returns True if the account is frozen
     */
    async isFrozen(account: Address): Promise<boolean> {
        return (await this.contract.read.isFrozen([account])) as Promise<boolean>;
    }

    /**
     * Get all frozen accounts
     * @returns Array of frozen account addresses
     */
    async frozenAccounts(): Promise<readonly Address[]> {
        return (await this.contract.read.frozenAccounts()) as Promise<readonly Address[]>;
    }

    /**
     * Pause the contract, preventing most operations
     * @returns The transaction hash
     */
    async pause(): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.pause() as Promise<Hash>;
    }

    /**
     * Unpause the contract, resuming normal operations
     * @returns The transaction hash
     */
    async unpause(): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.unpause() as Promise<Hash>;
    }

    /**
     * Check if the contract is paused
     * @returns True if the contract is paused
     */
    async paused(): Promise<boolean> {
        return (await this.contract.read.paused()) as Promise<boolean>;
    }

    /**
     * Get the frozen status constant
     * @returns The bytes32 frozen status identifier
     */
    async ACCOUNT_FROZEN_STATUS(): Promise<`0x${string}`> {
        return (await this.contract.read.ACCOUNT_FROZEN_STATUS()) as Promise<`0x${string}`>;
    }

    /**
     * Get the unfrozen status constant
     * @returns The bytes32 unfrozen status identifier
     */
    async ACCOUNT_UNFROZEN_STATUS(): Promise<`0x${string}`> {
        return (await this.contract.read.ACCOUNT_UNFROZEN_STATUS()) as Promise<`0x${string}`>;
    }
}
