import type { Address, PublicClient, WalletClient } from 'viem';
import { getContract } from 'viem';
import { evmAuth1155Abi, evmAuth6909Abi } from '../abis/index.js';
import { AccessManagerSDK } from './access-manager.js';
import { AdminSDK } from './admin.js';
import type { EVMAuthContract } from './base.js';
import { BurnerSDK } from './burner.js';
import { ClientSDK } from './client.js';
import { MinterSDK } from './minter.js';
import { TokenManagerSDK } from './token-manager.js';
import { TreasurerSDK } from './treasurer.js';

// Re-export all SDK classes
export {
    BaseSDK,
    type EVMAuthContract,
    type EVMAuth1155Contract,
    type EVMAuth6909Contract,
} from './base.js';
export { AdminSDK } from './admin.js';
export { AccessManagerSDK } from './access-manager.js';
export {
    TokenManagerSDK,
    type TokenConfig,
    type CreateTokenParams,
    type UpdateTokenParams,
} from './token-manager.js';
export { MinterSDK, type MintParams, type MintBatchParams } from './minter.js';
export { BurnerSDK, type BurnParams, type BurnBatchParams } from './burner.js';
export { TreasurerSDK } from './treasurer.js';
export {
    ClientSDK,
    type BalanceRecord,
    type TransferParams,
    type BatchTransferParams,
} from './client.js';

/**
 * Create an EVMAuth1155 contract instance
 */
function getEVMAuth1155Contract<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthContract {
    return getContract({
        address,
        abi: evmAuth1155Abi,
        client,
    }) as EVMAuthContract;
}

/**
 * Create an EVMAuth6909 contract instance
 */
function getEVMAuth6909Contract<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthContract {
    return getContract({
        address,
        abi: evmAuth6909Abi,
        client,
    }) as EVMAuthContract;
}

/**
 * Factory function to create an AdminSDK instance for EVMAuth1155
 */
export function createAdminSDK1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): AdminSDK {
    const contract = getEVMAuth1155Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new AdminSDK(contract, isWalletClient);
}

/**
 * Factory function to create an AdminSDK instance for EVMAuth6909
 */
export function createAdminSDK6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): AdminSDK {
    const contract = getEVMAuth6909Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new AdminSDK(contract, isWalletClient);
}

/**
 * Factory function to create an AccessManagerSDK instance for EVMAuth1155
 */
export function createAccessManagerSDK1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): AccessManagerSDK {
    const contract = getEVMAuth1155Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new AccessManagerSDK(contract, isWalletClient);
}

/**
 * Factory function to create an AccessManagerSDK instance for EVMAuth6909
 */
export function createAccessManagerSDK6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): AccessManagerSDK {
    const contract = getEVMAuth6909Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new AccessManagerSDK(contract, isWalletClient);
}

/**
 * Factory function to create a TokenManagerSDK instance for EVMAuth1155
 */
export function createTokenManagerSDK1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): TokenManagerSDK {
    const contract = getEVMAuth1155Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new TokenManagerSDK(contract, isWalletClient);
}

/**
 * Factory function to create a TokenManagerSDK instance for EVMAuth6909
 */
export function createTokenManagerSDK6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): TokenManagerSDK {
    const contract = getEVMAuth6909Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new TokenManagerSDK(contract, isWalletClient);
}

/**
 * Factory function to create a MinterSDK instance for EVMAuth1155
 */
export function createMinterSDK1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): MinterSDK {
    const contract = getEVMAuth1155Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new MinterSDK(contract, isWalletClient);
}

/**
 * Factory function to create a MinterSDK instance for EVMAuth6909
 */
export function createMinterSDK6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): MinterSDK {
    const contract = getEVMAuth6909Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new MinterSDK(contract, isWalletClient);
}

/**
 * Factory function to create a BurnerSDK instance for EVMAuth1155
 */
export function createBurnerSDK1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): BurnerSDK {
    const contract = getEVMAuth1155Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new BurnerSDK(contract, isWalletClient);
}

/**
 * Factory function to create a BurnerSDK instance for EVMAuth6909
 */
export function createBurnerSDK6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): BurnerSDK {
    const contract = getEVMAuth6909Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new BurnerSDK(contract, isWalletClient);
}

/**
 * Factory function to create a TreasurerSDK instance for EVMAuth1155
 */
export function createTreasurerSDK1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): TreasurerSDK {
    const contract = getEVMAuth1155Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new TreasurerSDK(contract, isWalletClient);
}

/**
 * Factory function to create a TreasurerSDK instance for EVMAuth6909
 */
export function createTreasurerSDK6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): TreasurerSDK {
    const contract = getEVMAuth6909Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new TreasurerSDK(contract, isWalletClient);
}

/**
 * Factory function to create a ClientSDK instance for EVMAuth1155
 */
export function createClientSDK1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): ClientSDK {
    const contract = getEVMAuth1155Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new ClientSDK(contract, isWalletClient);
}

/**
 * Factory function to create a ClientSDK instance for EVMAuth6909
 */
export function createClientSDK6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): ClientSDK {
    const contract = getEVMAuth6909Contract(address, client);
    const isWalletClient = 'account' in client && client.account !== undefined;
    return new ClientSDK(contract, isWalletClient);
}

/**
 * Role constants for EVMAuth contracts
 */
export const ROLES = {
    DEFAULT_ADMIN: 'DEFAULT_ADMIN_ROLE',
    UPGRADE_MANAGER: 'UPGRADE_MANAGER_ROLE',
    ACCESS_MANAGER: 'ACCESS_MANAGER_ROLE',
    TOKEN_MANAGER: 'TOKEN_MANAGER_ROLE',
    MINTER: 'MINTER_ROLE',
    BURNER: 'BURNER_ROLE',
    TREASURER: 'TREASURER_ROLE',
} as const;

/**
 * Create a contract instance for EVMAuth1155 (for direct contract access)
 */
export { getEVMAuth1155Contract as getEVMAuth1155 };

/**
 * Create a contract instance for EVMAuth6909 (for direct contract access)
 */
export { getEVMAuth6909Contract as getEVMAuth6909 };
