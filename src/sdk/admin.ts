import type { Address, Hash } from 'viem';
import { BaseSDK } from './base.js';

/**
 * SDK for DEFAULT_ADMIN_ROLE holders
 * Provides methods for managing roles and admin settings
 */
export class AdminSDK extends BaseSDK {
    /**
     * Grant a role to an account
     * @param role The role to grant (use ROLES constant for predefined roles)
     * @param account The account to grant the role to
     * @returns The transaction hash
     */
    async grantRole(role: string | `0x${string}`, account: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const roleBytes = this.getRoleBytes(role);
        return this.contract.write.grantRole([roleBytes, account]) as Promise<Hash>;
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
        return this.contract.write.revokeRole([roleBytes, account]) as Promise<Hash>;
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
        return this.contract.write.renounceRole([roleBytes, account]) as Promise<Hash>;
    }

    /**
     * Check if an account has a specific role
     * @param role The role to check
     * @param account The account to check
     * @returns True if the account has the role
     */
    async hasRole(role: string | `0x${string}`, account: Address): Promise<boolean> {
        const roleBytes = this.getRoleBytes(role);
        return (await this.contract.read.hasRole([roleBytes, account])) as Promise<boolean>;
    }

    /**
     * Get the admin role for a specific role
     * @param role The role to query
     * @returns The admin role bytes32
     */
    async getRoleAdmin(role: string | `0x${string}`): Promise<`0x${string}`> {
        const roleBytes = this.getRoleBytes(role);
        return (await this.contract.read.getRoleAdmin([roleBytes])) as Promise<`0x${string}`>;
    }

    /**
     * Begin a default admin transfer
     * @param newAdmin The address of the new admin
     * @returns The transaction hash
     */
    async beginDefaultAdminTransfer(newAdmin: Address): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.beginDefaultAdminTransfer([newAdmin]) as Promise<Hash>;
    }

    /**
     * Accept a pending default admin transfer
     * @returns The transaction hash
     */
    async acceptDefaultAdminTransfer(): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.acceptDefaultAdminTransfer() as Promise<Hash>;
    }

    /**
     * Cancel a pending default admin transfer
     * @returns The transaction hash
     */
    async cancelDefaultAdminTransfer(): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.cancelDefaultAdminTransfer() as Promise<Hash>;
    }

    /**
     * Change the default admin delay
     * @param newDelay The new delay in seconds
     * @returns The transaction hash
     */
    async changeDefaultAdminDelay(newDelay: bigint): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.changeDefaultAdminDelay([newDelay]) as Promise<Hash>;
    }

    /**
     * Rollback the default admin delay
     * @returns The transaction hash
     */
    async rollbackDefaultAdminDelay(): Promise<Hash> {
        this.ensureWriteCapability();
        return this.contract.write.rollbackDefaultAdminDelay() as Promise<Hash>;
    }

    /**
     * Get the current default admin address
     * @returns The default admin address
     */
    async defaultAdmin(): Promise<Address> {
        return (await this.contract.read.defaultAdmin()) as Promise<Address>;
    }

    /**
     * Get the current default admin delay
     * @returns The delay in seconds
     */
    async defaultAdminDelay(): Promise<bigint> {
        return (await this.contract.read.defaultAdminDelay()) as Promise<bigint>;
    }

    /**
     * Get the pending default admin address and schedule
     * @returns Tuple of [newAdmin address, schedule timestamp]
     */
    async pendingDefaultAdmin(): Promise<readonly [Address, bigint]> {
        return (await this.contract.read.pendingDefaultAdmin()) as Promise<
            readonly [Address, bigint]
        >;
    }

    /**
     * Get the pending default admin delay
     * @returns Tuple of [newDelay, schedule timestamp]
     */
    async pendingDefaultAdminDelay(): Promise<readonly [bigint, bigint]> {
        return (await this.contract.read.pendingDefaultAdminDelay()) as Promise<
            readonly [bigint, bigint]
        >;
    }

    /**
     * Get the wait period for increasing the default admin delay
     * @returns The wait period in seconds
     */
    async defaultAdminDelayIncreaseWait(): Promise<bigint> {
        return (await this.contract.read.defaultAdminDelayIncreaseWait()) as Promise<bigint>;
    }

    /**
     * Convert role string to bytes32
     * @private
     */
    private getRoleBytes(role: string | `0x${string}`): `0x${string}` {
        if (role.startsWith('0x')) {
            return role as `0x${string}`;
        }

        // Map role names to their contract constants
        const roleMap: Record<string, string> = {
            DEFAULT_ADMIN_ROLE: 'DEFAULT_ADMIN_ROLE',
            UPGRADE_MANAGER_ROLE: 'UPGRADE_MANAGER_ROLE',
            ACCESS_MANAGER_ROLE: 'ACCESS_MANAGER_ROLE',
            TOKEN_MANAGER_ROLE: 'TOKEN_MANAGER_ROLE',
            MINTER_ROLE: 'MINTER_ROLE',
            BURNER_ROLE: 'BURNER_ROLE',
            TREASURER_ROLE: 'TREASURER_ROLE',
        };

        if (role in roleMap) {
            // Get the role bytes32 from the contract
            return this.contract.read[roleMap[role]]() as unknown as `0x${string}`;
        }

        throw new Error(`Unknown role: ${role}`);
    }
}
