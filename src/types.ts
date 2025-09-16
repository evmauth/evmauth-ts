import type { Address, GetContractReturnType, Hash, PublicClient, WalletClient } from 'viem';
import type { abiEVMAuth1155, abiEVMAuth6909 } from './abi/index.js';

export type EVMAuthRole =
    | 'DEFAULT_ADMIN_ROLE'
    | 'UPGRADE_MANAGER_ROLE'
    | 'ACCESS_MANAGER_ROLE'
    | 'TOKEN_MANAGER_ROLE'
    | 'MINTER_ROLE'
    | 'BURNER_ROLE'
    | 'TREASURER_ROLE';

export type TokenStandard = 'ERC-1155' | 'ERC-6909';

export type EVMAuth1155Contract = GetContractReturnType<
    typeof abiEVMAuth1155,
    PublicClient | WalletClient
>;

export type EVMAuth6909Contract = GetContractReturnType<
    typeof abiEVMAuth6909,
    PublicClient | WalletClient
>;

export type EVMAuthContract = EVMAuth1155Contract | EVMAuth6909Contract;

export type EVMAuthContractType = 'EVMAuth1155' | 'EVMAuth6909';

export interface DeploymentOptions {
    initialDelay?: number;
    initialDefaultAdmin?: Address;
    initialTreasury?: Address;
    roleGrants?: Array<{ role: Hash; account: Address }>;
    uri?: string;
}

export interface PaymentToken {
    token: Address;
    price: bigint;
}

export interface EVMAuthTokenConfig {
    price: bigint;
    erc20Prices: PaymentToken[];
    ttl: bigint;
    transferable: boolean;
}

export interface EVMAuthToken {
    id: bigint;
    config: EVMAuthTokenConfig;
}

export interface BalanceRecord {
    amount: number | bigint;
    expiresAt: number | bigint;
}

export interface MintParams {
    to: Address;
    tokenId: bigint;
    amount: bigint;
    data?: `0x${string}`;
}

export interface MintBatchParams {
    to: Address;
    tokenIds: readonly bigint[];
    amounts: readonly bigint[];
    data?: `0x${string}`;
}

export interface BurnParams {
    from: Address;
    tokenId: bigint;
    amount: bigint;
}

export interface BurnBatchParams {
    from: Address;
    tokenIds: readonly bigint[];
    amounts: readonly bigint[];
}

export interface TransferParams {
    from: Address;
    to: Address;
    tokenId: bigint;
    amount: bigint;
    data?: `0x${string}`;
}

export interface BatchTransferParams {
    from: Address;
    to: Address;
    tokenIds: readonly bigint[];
    amounts: readonly bigint[];
    data?: `0x${string}`;
}
