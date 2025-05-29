import type { JsonRpcProvider, Wallet } from 'ethers';

export type EVMAuthRole =
    | 'BLACKLIST_MANAGER_ROLE'
    | 'DEFAULT_ADMIN_ROLE'
    | 'FINANCE_MANAGER_ROLE'
    | 'TOKEN_BURNER_ROLE'
    | 'TOKEN_MANAGER_ROLE'
    | 'TOKEN_MINTER_ROLE';

export interface TokenMetadata {
    id: number | bigint;
    active: boolean;
    burnable: boolean;
    transferable: boolean;
    price: number | bigint;
    ttl: number | bigint;
}

export interface BaseMetadata {
    id: number | bigint;
    active: boolean;
    burnable: boolean;
    transferable: boolean;
}

export interface Group {
    balance: number | bigint;
    expiresAt: number | bigint;
}

export type Signer =
    | Wallet
    | {
          signMessage: (message: string | Uint8Array) => Promise<string>;
          provider: JsonRpcProvider;
      };
