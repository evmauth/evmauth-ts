import type { Address, Hash, TransactionReceipt } from 'viem';
import type { BalanceRecord, BatchTransferParams, PaymentToken, TransferParams } from '../types.js';
import { EVMAuthBaseClient } from './base.js';

/**
 * Client for public/external functionality
 * Provides methods for purchasing, transferring, and querying tokens
 */
export class EVMAuthPublicClient extends EVMAuthBaseClient {
    /**
     * Purchase tokens with native currency
     * @param tokenId The token ID to purchase
     * @param amount The amount of tokens to purchase
     * @returns The transaction hash
     */
    async purchase(tokenId: bigint, amount: bigint): Promise<Hash> {
        this.ensureWriteCapability();
        const price = await this.tokenPrice(tokenId);
        const totalCost = price * amount;
        const hash = await this.contract.write.purchase([tokenId, amount], {
            value: totalCost,
        });

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Purchase token transaction failed');
        }

        return hash;
    }

    /**
     * Purchase tokens for another address with native currency
     * @param receiver The address to receive the tokens
     * @param tokenId The token ID to purchase
     * @param amount The amount of tokens to purchase
     * @returns The transaction hash
     */
    async purchaseFor(receiver: Address, tokenId: bigint, amount: bigint): Promise<Hash> {
        this.ensureWriteCapability();
        const price = await this.tokenPrice(tokenId);
        const totalCost = price * amount;
        const hash = await this.contract.write.purchaseFor([receiver, tokenId, amount], {
            value: totalCost,
        });

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Purchase token transaction failed');
        }

        return hash;
    }

    /**
     * Purchase tokens with an ERC20 token
     * @param tokenId The token ID to purchase
     * @param amount The amount of tokens to purchase
     * @param paymentToken The ERC20 token address to use for payment
     * @returns The transaction hash
     */
    async purchaseWithERC20(tokenId: bigint, amount: bigint, paymentToken: Address): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.purchaseWithERC20([tokenId, amount, paymentToken]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Purchase token with ERC20 transaction failed');
        }

        return hash;
    }

    /**
     * Purchase tokens for another address with an ERC20 token
     * @param receiver The address to receive the tokens
     * @param tokenId The token ID to purchase
     * @param amount The amount of tokens to purchase
     * @param paymentToken The ERC20 token address to use for payment
     * @returns The transaction hash
     */
    async purchaseWithERC20For(
        receiver: Address,
        tokenId: bigint,
        amount: bigint,
        paymentToken: Address
    ): Promise<Hash> {
        this.ensureWriteCapability();
        const hash = await this.contract.write.purchaseWithERC20For([
            receiver,
            tokenId,
            amount,
            paymentToken,
        ]);

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Purchase token with ERC20 transaction failed');
        }

        return hash;
    }

    /**
     * Get the balance of an account for a specific token
     * @param account The account to query
     * @param tokenId The token ID
     * @returns The balance amount
     */
    async balanceOf(account: Address, tokenId: bigint): Promise<bigint> {
        return (await this.contract.read.balanceOf([account, tokenId])) as bigint;
    }

    /**
     * Get balances for multiple token types
     * @param accounts Array of accounts to query
     * @param tokenIds Array of token IDs
     * @returns Array of balance amounts
     */
    async balanceOfBatch(
        accounts: readonly Address[],
        tokenIds: readonly bigint[]
    ): Promise<readonly bigint[]> {
        if (accounts.length !== tokenIds.length) {
            throw new Error('Accounts and token IDs arrays must have the same length');
        }

        // For ERC-1155, use the batch balance function
        if (this.isERC1155) {
            return (await this.contract.read.balanceOfBatch([accounts, tokenIds])) as Promise<
                readonly bigint[]
            >;
        }

        // For ERC-6909, fetch balance for each token type individually
        const promises = accounts.map((account, index) => this.balanceOf(account, tokenIds[index]));
        return Promise.all(promises);
    }

    /**
     * Get detailed balance records for an account and token
     * @param account The account to query
     * @param tokenId The token ID
     * @returns Array of balance records with amounts and expiration times
     */
    async balanceRecordsOf(account: Address, tokenId: bigint): Promise<readonly BalanceRecord[]> {
        const records = (await this.contract.read.balanceRecordsOf([
            account,
            tokenId,
        ])) as readonly { amount: bigint; expiresAt: bigint }[];

        return records.map((record) => ({
            amount: record.amount,
            expiresAt: record.expiresAt,
        }));
    }

    /**
     * Check if a user has sufficient balance for a specific token
     * @param account The account to check
     * @param tokenId The token ID
     * @param requiredAmount The minimum amount required
     * @returns True if the account has sufficient balance
     */
    async hasRequiredBalance(
        account: Address,
        tokenId: bigint,
        requiredAmount: bigint
    ): Promise<boolean> {
        const balance = await this.balanceOf(account, tokenId);
        return balance >= requiredAmount;
    }

    /**
     * Transfer tokens safely
     * @param params Transfer parameters
     * @returns The transaction hash
     */
    async transferFrom(params: TransferParams): Promise<Hash> {
        this.ensureWriteCapability();

        let hash: Hash;

        if (this.isERC1155) {
            // For ERC-1155, include the data parameter (default to '0x' if not provided)
            hash = await this.contract.write.safeTransferFrom([
                params.from,
                params.to,
                params.tokenId,
                params.amount,
                params.data ?? '0x',
            ]);
        } else {
            // For ERC-6909, use the standard transfer function
            hash = await this.contract.write.transferFrom([
                params.from,
                params.to,
                params.tokenId,
                params.amount,
            ]);
        }

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Token transfer transaction failed');
        }

        return hash;
    }

    /**
     * Transfer multiple token types
     * @param params Batch transfer parameters
     * @returns An array containing the transaction hash(es)
     */
    async batchTransferFrom(params: BatchTransferParams): Promise<Hash[]> {
        this.ensureWriteCapability();

        if (params.tokenIds.length !== params.amounts.length) {
            throw new Error('Token IDs and amounts arrays must have the same length');
        }

        const hashes: Hash[] = [];

        // For ERC-1155, use the batch transfer function
        if (this.isERC1155) {
            const hash = await this.contract.write.safeBatchTransferFrom([
                params.from,
                params.to,
                params.tokenIds,
                params.amounts,
                params.data ?? '0x',
            ]);
            hashes.push(hash);

            // Wait for the transaction receipt
            const receipt = await this.getTransactionReceipt(hash);
            if (receipt.status !== 'success') {
                throw new Error('Token transfer batch transaction failed');
            }

            return hashes;
        }

        // For ERC-6909, transfer each token type individually
        const receiptTxs: Promise<TransactionReceipt>[] = [];
        for (let i = 0; i < params.tokenIds.length; i++) {
            const hash = await this.transferFrom({
                from: params.from,
                to: params.to,
                tokenId: params.tokenIds[i],
                amount: params.amounts[i],
            });
            hashes.push(hash);
            receiptTxs.push(this.getTransactionReceipt(hash));
        }

        // Check for any failed transactions
        const receipts = await Promise.all(receiptTxs);
        const failures = receipts.filter((r) => r.status !== 'success');
        if (failures.length > 0) {
            const failedHashes = failures
                .map((f: TransactionReceipt) => f.transactionHash)
                .join(', ');
            throw new Error(
                `${failures.length} of ${receipts.length} token transfer transactions failed: ${failedHashes}`
            );
        }

        return hashes;
    }

    /**
     * Set approval for an operator to manage all tokens
     * @param operator The operator address
     * @param approved Whether to approve or revoke
     * @returns The transaction hash
     */
    async setApprovalForAll(operator: Address, approved: boolean): Promise<Hash> {
        this.ensureWriteCapability();

        let hash: Hash;

        if (this.isERC1155) {
            hash = await this.contract.write.setApprovalForAll([operator, approved]);
        } else {
            hash = await this.contract.write.setOperator([operator, approved]);
        }

        // Wait for the transaction receipt
        const receipt = await this.getTransactionReceipt(hash);
        if (receipt.status !== 'success') {
            throw new Error('Token transfer transaction failed');
        }

        return hash;
    }

    /**
     * Check if an operator is approved to manage all tokens for an account
     * @param account The account that granted approval
     * @param operator The operator to check
     * @returns True if the operator is approved
     */
    async isApprovedForAll(account: Address, operator: Address): Promise<boolean> {
        if (this.isERC1155) {
            return (await this.contract.read.isApprovedForAll([account, operator])) as boolean;
        }
        return (await this.contract.read.isOperator([account, operator])) as boolean;
    }

    /**
     * Check if a token exists
     * @param tokenId The token ID
     * @returns True if the token exists
     */
    async exists(tokenId: bigint): Promise<boolean> {
        return (await this.contract.read.exists([tokenId])) as boolean;
    }

    /**
     * Get the next token ID that will be created
     * @returns The next token ID
     */
    async nextTokenID(): Promise<bigint> {
        return (await this.contract.read.nextTokenID()) as bigint;
    }

    /**
     * Get the price of a token in native currency
     * @param tokenId The token ID
     * @returns The price in wei
     */
    async tokenPrice(tokenId: bigint): Promise<bigint> {
        return (await this.contract.read.tokenPrice([tokenId])) as bigint;
    }

    /**
     * Get the prices of a token in various ERC20 tokens that are accepted for payment
     * @param tokenId The token ID
     * @returns A map of prices in ERC20 tokens
     */
    async tokenERC20Prices(tokenId: bigint): Promise<PaymentToken[]> {
        return (await this.contract.read.tokenERC20Prices([tokenId])) as PaymentToken[];
    }

    /**
     * Check if a token is purchasable with a specific ERC20 token
     * @param tokenId The token ID
     * @param paymentToken The ERC20 payment token address
     * @returns True if the payment token is accepted
     */
    async isAcceptedERC20PaymentToken(tokenId: bigint, paymentToken: Address): Promise<boolean> {
        const token = await this.tokenERC20Prices(tokenId);
        return token.some(({ token: address }) => address === paymentToken);
    }

    /**
     * Get the URI for a token
     * @param tokenId The token ID
     * @returns The token URI
     */
    async uri(tokenId: bigint): Promise<string> {
        // For ERC-1155, use uri method
        if (this.isERC1155) {
            return (await this.contract.read.uri([tokenId])) as string;
        }

        // For ERC-6909, use tokenURI method
        return (await this.contract.read.tokenURI([tokenId])) as string;
    }

    /**
     * Alias for uri, using the semantics of ERC-6909
     * @param tokenId The token ID
     * @returns The token URI
     */
    async tokenURI(tokenId: bigint): Promise<string> {
        return await this.uri(tokenId);
    }

    /**
     * Check if the contract supports a specific interface
     * @param interfaceId The interface ID to check
     * @returns True if the interface is supported
     */
    async supportsInterface(interfaceId: `0x${string}`): Promise<boolean> {
        return (await this.contract.read.supportsInterface([interfaceId])) as boolean;
    }

    /**
     * Get the current owner of the contract
     * @returns The owner address
     */
    async owner(): Promise<Address> {
        return (await this.contract.read.owner()) as Address;
    }
}
