import type { JsonRpcProvider, Wallet } from 'ethers';

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
