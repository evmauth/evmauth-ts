import type { JsonRpcProvider, Wallet } from 'ethers';

export type EVMAuthRole =
    | 'DEFAULT_ADMIN_ROLE'
    | 'UPGRADE_MANAGER_ROLE'
    | 'ACCESS_MANAGER_ROLE'
    | 'TOKEN_MANAGER_ROLE'
    | 'MINTER_ROLE'
    | 'BURNER_ROLE'
    | 'TREASURER_ROLE';

export interface EVMAuthTokenConfig {
    price: number | bigint;
    erc20Prices: { token: string; price: number | bigint }[];
    ttl: number | bigint;
    transferable: boolean;
}

export interface EVMAuthToken {
    id: number | bigint;
    config: EVMAuthTokenConfig;
}

export interface BalanceRecord {
    amount: number | bigint;
    expiresAt: number | bigint;
}

export type Signer =
    | Wallet
    | {
          signMessage: (message: string | Uint8Array) => Promise<string>;
          provider: JsonRpcProvider;
      };
