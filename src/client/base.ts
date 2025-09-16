import type { Address, Client, PublicClient, TransactionReceipt, WalletClient } from 'viem';
import { publicActions } from 'viem';
import { erc1155, erc6909 } from '../constants.js';
import type { EVMAuthContract, TokenStandard } from '../types.js';

/**
 * Base Client class that provides common functionality for all role-specific Clients
 */
export abstract class EVMAuthBaseClient {
    protected readonly contract: EVMAuthContract;
    protected readonly tokenStandard: TokenStandard;
    protected readonly client: Client;
    protected readonly isWalletClient: boolean;

    constructor(contract: EVMAuthContract, tokenStandard: TokenStandard, client: Client) {
        this.contract = contract;
        this.tokenStandard = tokenStandard;
        this.isWalletClient = 'account' in client && client.account !== undefined;
        this.client = this.isWalletClient ? (client as WalletClient).extend(publicActions) : client;
    }

    get isERC1155(): boolean {
        return this.tokenStandard === erc1155;
    }

    get isERC6909(): boolean {
        return this.tokenStandard === erc6909;
    }

    /**
     * Get the contract address
     */
    get address(): Address {
        return this.contract.address;
    }

    /**
     * Check if the Client has write capabilities
     */
    canWrite(): boolean {
        return this.isWalletClient;
    }

    /**
     * Get the underlying contract instance
     */
    getContract(): EVMAuthContract {
        return this.contract;
    }

    /**
     * Fetch a transaction receipt by its hash
     * @param txHash The transaction hash
     * @returns The transaction receipt
     */
    getTransactionReceipt(txHash: `0x${string}`): Promise<TransactionReceipt> {
        return (this.client as PublicClient).waitForTransactionReceipt({ hash: txHash });
    }

    /**
     * Ensure the Client has write capabilities
     * @throws Error if the Client is read-only
     */
    protected ensureWriteCapability(): void {
        if (!this.canWrite()) {
            throw new Error(
                'This Client instance is read-only. Use a WalletClient to perform write operations.'
            );
        }
    }
}
