import type { Address, Hash } from 'viem';
import { roles } from '../constants.js';
import { EVMAuthBaseClient } from './base.js';

/**
 * Client for DEFAULT_ADMIN_ROLE holders
 * Provides methods for managing roles and admin settings
 */
export class EVMAuthAdminClient extends EVMAuthBaseClient {
    /**
     * Grant a role to an account
     * @param role The role to grant (use ROLES constant for predefined roles)
     * @param account The account to grant the role to
     * @returns The transaction hash
     */
    async grantRole(role: string | `0x${string}`, account: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const roleBytes = this.getRoleBytes(role);
        const hash = await this.contract.write.grantRole([roleBytes, account]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Grant role transaction failed');
        }

        return hash;
    }

    /**
     * Revoke a role from an account
     * @param role The role to revoke
     * @param account The account to revoke the role from
     * @returns The transaction hash
     */
    async revokeRole(role: string | `0x${string}`, account: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const roleBytes = this.getRoleBytes(role);
        const hash = await this.contract.write.revokeRole([roleBytes, account]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Revoke role transaction failed');
        }

        return hash;
    }

    /**
     * Renounce a role from the calling account
     * @param role The role to renounce
     * @param account The account renouncing the role (must be the caller)
     * @returns The transaction hash
     */
    async renounceRole(role: string | `0x${string}`, account: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const roleBytes = this.getRoleBytes(role);
        const hash = await this.contract.write.renounceRole([roleBytes, account]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Renounce role transaction failed');
        }

        return hash;
    }

    /**
     * Check if an account has a specific role
     * @param role The role to check
     * @param account The account to check
     * @returns True if the account has the role
     */
    async hasRole(role: string | `0x${string}`, account: Address): Promise<boolean> {
        const roleBytes = this.getRoleBytes(role);
        return (await this.contract.read.hasRole([roleBytes, account])) as boolean;
    }

    /**
     * Get the admin role for a specific role
     * @param role The role to query
     * @returns The admin role bytes32
     */
    async getRoleAdmin(role: string | `0x${string}`): Promise<`0x${string}`> {
        const roleBytes = this.getRoleBytes(role);
        return (await this.contract.read.getRoleAdmin([roleBytes])) as `0x${string}`;
    }

    /**
     * Begin a default admin transfer
     * @param newAdmin The address of the new admin
     * @returns The transaction hash
     */
    async beginDefaultAdminTransfer(newAdmin: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.beginDefaultAdminTransfer([newAdmin]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Begin default admin transfer transaction failed');
        }

        return hash;
    }

    /**
     * Accept a pending default admin transfer
     * @returns The transaction hash
     */
    async acceptDefaultAdminTransfer(): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.acceptDefaultAdminTransfer();

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Accept default admin transfer transaction failed');
        }

        return hash;
    }

    /**
     * Cancel a pending default admin transfer
     * @returns The transaction hash
     */
    async cancelDefaultAdminTransfer(): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.cancelDefaultAdminTransfer();

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Cancel default admin transfer transaction failed');
        }

        return hash;
    }

    /**
     * Change the default admin delay
     * @param newDelay The new delay in seconds
     * @returns The transaction hash
     */
    async changeDefaultAdminDelay(newDelay: number): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.changeDefaultAdminDelay([newDelay]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Change default admin delay transaction failed');
        }

        return hash;
    }

    /**
     * Rollback the default admin delay
     * @returns The transaction hash
     */
    async rollbackDefaultAdminDelay(): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.rollbackDefaultAdminDelay();

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Rollback default admin delay transaction failed');
        }

        return hash;
    }

    /**
     * Get the current default admin address
     * @returns The default admin address
     */
    async defaultAdmin(): Promise<Address> {
        return (await this.contract.read.defaultAdmin()) as Address;
    }

    /**
     * Get the current default admin delay
     * @returns The delay in seconds
     */
    async defaultAdminDelay(): Promise<number> {
        return (await this.contract.read.defaultAdminDelay()) as number;
    }

    /**
     * Get the pending default admin address and schedule
     * @returns Object with pending admin address and schedule timestamp
     */
    async pendingDefaultAdmin(): Promise<{ address: Address; schedule: number }> {
        const res = (await this.contract.read.pendingDefaultAdmin()) as [Address, number];
        return { address: res[0], schedule: res[1] };
    }

    /**
     * Get the pending default admin delay
     * @returns Object with pending delay and schedule timestamp
     */
    async pendingDefaultAdminDelay(): Promise<{ delay: number; schedule: number }> {
        const res = (await this.contract.read.pendingDefaultAdminDelay()) as [number, number];
        return { delay: res[0], schedule: res[1] };
    }

    /**
     * Get the wait period for increasing the default admin delay
     * @returns The wait period in seconds
     */
    async defaultAdminDelayIncreaseWait(): Promise<bigint> {
        return BigInt((await this.contract.read.defaultAdminDelayIncreaseWait()) as string);
    }

    /**
     * Convert role string to bytes32
     * @private
     */
    private getRoleBytes(role: string | `0x${string}`): `0x${string}` {
        if (role.startsWith('0x')) {
            return role as `0x${string}`;
        }

        if (role in roles) {
            return roles[role as keyof typeof roles] as `0x${string}`;
        }

        throw new Error(`Unknown role: ${role}`);
    }
}
