import { keccak256, toBytes } from 'viem';
import type { EVMAuthContractType } from './types.js';

export const roles = {
    DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
    UPGRADE_MANAGER_ROLE: keccak256(toBytes('UPGRADE_MANAGER_ROLE')),
    ACCESS_MANAGER_ROLE: keccak256(toBytes('ACCESS_MANAGER_ROLE')),
    TOKEN_MANAGER_ROLE: keccak256(toBytes('TOKEN_MANAGER_ROLE')),
    MINTER_ROLE: keccak256(toBytes('MINTER_ROLE')),
    BURNER_ROLE: keccak256(toBytes('BURNER_ROLE')),
    TREASURER_ROLE: keccak256(toBytes('TREASURER_ROLE')),
};

export const erc1155 = 'ERC-1155';
export const erc6909 = 'ERC-6909';

export const tokenStandardInterfaceIds: Record<EVMAuthContractType, `0x${string}`> = {
    EVMAuth1155: '0xd9b67a26', // ERC-1155
    EVMAuth6909: '0x0f632fb3', // ERC-6909
};
