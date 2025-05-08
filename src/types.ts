import type { JsonRpcProvider, Wallet } from 'ethers';

export interface TokenMetadata {
    active: boolean;
    burnable: boolean;
    transferable: boolean;
    price: bigint;
    ttl: bigint;
}

export interface BaseMetadata {
    active: boolean;
    burnable: boolean;
    transferable: boolean;
}

export interface Group {
    balance: bigint;
    expiresAt: bigint;
}

export type Signer =
    | Wallet
    | {
          signMessage: (message: string | Uint8Array) => Promise<string>;
          provider: JsonRpcProvider;
      };
