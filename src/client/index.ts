import type { Address, PublicClient, WalletClient } from 'viem';
import { getContract } from 'viem';
import { abiEVMAuth1155, abiEVMAuth6909 } from '../abi/index.js';
import { erc1155, erc6909 } from '../constants.js';
import type { EVMAuthContract } from '../types.js';
import { EVMAuthAccessManagerClient } from './access-manager.js';
import { EVMAuthAdminClient } from './admin.js';
import { EVMAuthBurnerClient } from './burner.js';
import { EVMAuthMinterClient } from './minter.js';
import { EVMAuthPublicClient } from './public.js';
import { EVMAuthTokenManagerClient } from './token-manager.js';
import { EVMAuthTreasurerClient } from './treasurer.js';

// Re-export all Client classes
export { EVMAuthBaseClient } from './base.js';
export { EVMAuthAdminClient } from './admin.js';
export { EVMAuthAccessManagerClient } from './access-manager.js';
export { EVMAuthTokenManagerClient } from './token-manager.js';
export { EVMAuthMinterClient } from './minter.js';
export { EVMAuthBurnerClient } from './burner.js';
export { EVMAuthTreasurerClient } from './treasurer.js';
export { EVMAuthPublicClient } from './public.js';

/**
 * Create an EVMAuth1155 contract instance
 */
export function getEVMAuth1155Contract<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthContract {
    return getContract({
        address,
        abi: abiEVMAuth1155,
        client,
    }) as EVMAuthContract;
}

/**
 * Create an EVMAuth6909 contract instance
 */
export function getEVMAuth6909Contract<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthContract {
    return getContract({
        address,
        abi: abiEVMAuth6909,
        client,
    }) as EVMAuthContract;
}

/**
 * Factory function to create an EVMAuthAdminClient instance for EVMAuth1155
 */
export function createAdminClient1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthAdminClient {
    const contract = getEVMAuth1155Contract(address, client);
    return new EVMAuthAdminClient(contract, erc1155, client);
}

/**
 * Factory function to create an EVMAuthAdminClient instance for EVMAuth6909
 */
export function createAdminClient6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthAdminClient {
    const contract = getEVMAuth6909Contract(address, client);
    return new EVMAuthAdminClient(contract, erc6909, client);
}

/**
 * Factory function to create an EVMAuthAccessManagerClient instance for EVMAuth1155
 */
export function createAccessManagerClient1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthAccessManagerClient {
    const contract = getEVMAuth1155Contract(address, client);
    return new EVMAuthAccessManagerClient(contract, erc1155, client);
}

/**
 * Factory function to create an EVMAuthAccessManagerClient instance for EVMAuth6909
 */
export function createAccessManagerClient6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthAccessManagerClient {
    const contract = getEVMAuth6909Contract(address, client);
    return new EVMAuthAccessManagerClient(contract, erc6909, client);
}

/**
 * Factory function to create a EVMAuthTokenManagerClient instance for EVMAuth1155
 */
export function createTokenManagerClient1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthTokenManagerClient {
    const contract = getEVMAuth1155Contract(address, client);
    return new EVMAuthTokenManagerClient(contract, erc1155, client);
}

/**
 * Factory function to create a EVMAuthTokenManagerClient instance for EVMAuth6909
 */
export function createTokenManagerClient6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthTokenManagerClient {
    const contract = getEVMAuth6909Contract(address, client);
    return new EVMAuthTokenManagerClient(contract, erc6909, client);
}

/**
 * Factory function to create a EVMAuthMinterClient instance for EVMAuth1155
 */
export function createMinterClient1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthMinterClient {
    const contract = getEVMAuth1155Contract(address, client);
    return new EVMAuthMinterClient(contract, erc1155, client);
}

/**
 * Factory function to create a EVMAuthMinterClient instance for EVMAuth6909
 */
export function createMinterClient6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthMinterClient {
    const contract = getEVMAuth6909Contract(address, client);
    return new EVMAuthMinterClient(contract, erc6909, client);
}

/**
 * Factory function to create a EVMAuthBurnerClient instance for EVMAuth1155
 */
export function createBurnerClient1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthBurnerClient {
    const contract = getEVMAuth1155Contract(address, client);
    return new EVMAuthBurnerClient(contract, erc1155, client);
}

/**
 * Factory function to create a EVMAuthBurnerClient instance for EVMAuth6909
 */
export function createBurnerClient6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthBurnerClient {
    const contract = getEVMAuth6909Contract(address, client);
    return new EVMAuthBurnerClient(contract, erc6909, client);
}

/**
 * Factory function to create a EVMAuthTreasurerClient instance for EVMAuth1155
 */
export function createTreasurerClient1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthTreasurerClient {
    const contract = getEVMAuth1155Contract(address, client);
    return new EVMAuthTreasurerClient(contract, erc1155, client);
}

/**
 * Factory function to create a EVMAuthTreasurerClient instance for EVMAuth6909
 */
export function createTreasurerClient6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthTreasurerClient {
    const contract = getEVMAuth6909Contract(address, client);
    return new EVMAuthTreasurerClient(contract, erc6909, client);
}

/**
 * Factory function to create a EVMAuthPublicClient instance for EVMAuth1155
 */
export function createPublicClient1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthPublicClient {
    const contract = getEVMAuth1155Contract(address, client);
    return new EVMAuthPublicClient(contract, erc1155, client);
}

/**
 * Factory function to create a EVMAuthPublicClient instance for EVMAuth6909
 */
export function createPublicClient6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
): EVMAuthPublicClient {
    const contract = getEVMAuth6909Contract(address, client);
    return new EVMAuthPublicClient(contract, erc6909, client);
}

export const clients = {
    EVMAuth1155: {
        createAccessManagerClient: createAccessManagerClient1155,
        createAdminClient: createAdminClient1155,
        createBurnerClient: createBurnerClient1155,
        createMinterClient: createMinterClient1155,
        createPublicClient: createPublicClient1155,
        createTokenManagerClient: createTokenManagerClient1155,
        createTreasurerClient: createTreasurerClient1155,
    },
    EVMAuth6909: {
        createAccessManagerClient: createAccessManagerClient6909,
        createAdminClient: createAdminClient6909,
        createBurnerClient: createBurnerClient6909,
        createMinterClient: createMinterClient6909,
        createPublicClient: createPublicClient6909,
        createTokenManagerClient: createTokenManagerClient6909,
        createTreasurerClient: createTreasurerClient6909,
    },
};
