import type { ContractTransactionResponse, JsonRpcProvider } from 'ethers';
import { Contract } from 'ethers';
import ABI from './abi.json' with { type: 'json' };
import type { BaseMetadata, Group, Signer, TokenMetadata } from './types.js';

export const roles = {
    blacklistManager: 'BLACKLIST_MANAGER_ROLE',
    defaultAdmin: 'DEFAULT_ADMIN_ROLE',
    financeManager: 'FINANCE_MANAGER_ROLE',
    tokenBurner: 'TOKEN_BURNER_ROLE',
    tokenManager: 'TOKEN_MANAGER_ROLE',
    tokenMinter: 'TOKEN_MINTER_ROLE',
};

/**
 * SDK for interacting with EVMAuth smart contracts
 */
export class EVMAuth {
    private readonly contract: Contract;
    private readonly signer?: Signer;

    /**
     * Create a new instance of the EVMAuth SDK
     * @param contractAddress The address of the deployed EVMAuth contract
     * @param providerOrSigner A provider or signer instance
     */
    constructor(contractAddress: string, providerOrSigner: JsonRpcProvider | Signer) {
        if (
            'signMessage' in providerOrSigner &&
            typeof providerOrSigner.signMessage === 'function'
        ) {
            // It's a signer
            this.signer = providerOrSigner;
            this.contract = new Contract(contractAddress, ABI, providerOrSigner);
        } else {
            // It's a provider
            this.contract = new Contract(contractAddress, ABI, providerOrSigner);
        }
    }

    /**
     * Connect a signer to the SDK
     * @param signer The signer to connect
     * @returns A new SDK instance with the signer connected
     */
    connect(signer: Signer): EVMAuth {
        return new EVMAuth(this.contract.target as string, signer);
    }

    /**
     * Get the contract instance
     * @returns The ethers Contract instance
     */
    getContract(): Contract {
        return this.contract;
    }

    // Role constants accessors
    /**
     * Get the DEFAULT_ADMIN_ROLE constant
     * @returns The DEFAULT_ADMIN_ROLE bytes32 value
     */
    async DEFAULT_ADMIN_ROLE(): Promise<string> {
        return await this.contract.DEFAULT_ADMIN_ROLE();
    }

    /**
     * Get the TOKEN_MANAGER_ROLE constant
     * @returns The TOKEN_MANAGER_ROLE bytes32 value
     */
    async TOKEN_MANAGER_ROLE(): Promise<string> {
        return await this.contract.TOKEN_MANAGER_ROLE();
    }

    /**
     * Get the TOKEN_MINTER_ROLE constant
     * @returns The TOKEN_MINTER_ROLE bytes32 value
     */
    async TOKEN_MINTER_ROLE(): Promise<string> {
        return await this.contract.TOKEN_MINTER_ROLE();
    }

    /**
     * Get the TOKEN_BURNER_ROLE constant
     * @returns The TOKEN_BURNER_ROLE bytes32 value
     */
    async TOKEN_BURNER_ROLE(): Promise<string> {
        return await this.contract.TOKEN_BURNER_ROLE();
    }

    /**
     * Get the BLACKLIST_MANAGER_ROLE constant
     * @returns The BLACKLIST_MANAGER_ROLE bytes32 value
     */
    async BLACKLIST_MANAGER_ROLE(): Promise<string> {
        return await this.contract.BLACKLIST_MANAGER_ROLE();
    }

    /**
     * Get the FINANCE_MANAGER_ROLE constant
     * @returns The FINANCE_MANAGER_ROLE bytes32 value
     */
    async FINANCE_MANAGER_ROLE(): Promise<string> {
        return await this.contract.FINANCE_MANAGER_ROLE();
    }

    /**
     * Get the PROJECT_ID constant
     * @returns The PROJECT_ID bytes32 value
     */
    async PROJECT_ID(): Promise<string> {
        return await this.contract.PROJECT_ID();
    }

    // Role management functions
    /**
     * Check if an account has a specific role
     * @param role The role to check
     * @param account The account to check
     * @returns True if the account has the role, false otherwise
     */
    async hasRole(role: string, account: string): Promise<boolean> {
        return await this.contract.hasRole(role, account);
    }

    /**
     * Grant a role to an account
     * @param role The role to grant
     * @param account The account to grant the role to
     * @returns The transaction response
     */
    async grantRole(role: string, account: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.grantRole(role, account);
    }

    /**
     * Grant multiple roles to an account
     * @param roles Array of roles to grant
     * @param account The account to grant the roles to
     * @returns The transaction response
     */
    async grantRoles(roles: string[], account: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.grantRoles(roles, account);
    }

    /**
     * Revoke a role from an account
     * @param role The role to revoke
     * @param account The account to revoke the role from
     * @returns The transaction response
     */
    async revokeRole(role: string, account: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.revokeRole(role, account);
    }

    /**
     * Revoke multiple roles from an account
     * @param roles Array of roles to revoke
     * @param account The account to revoke the roles from
     * @returns The transaction response
     */
    async revokeRoles(roles: string[], account: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.revokeRoles(roles, account);
    }

    /**
     * Renounce a role for an account (account must be the caller)
     * @param role The role to renounce
     * @param account The account renouncing the role
     * @returns The transaction response
     */
    async renounceRole(role: string, account: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.renounceRole(role, account);
    }

    /**
     * Get the admin role for a specific role
     * @param role The role to get the admin for
     * @returns The admin role bytes32 value
     */
    async getRoleAdmin(role: string): Promise<string> {
        return await this.contract.getRoleAdmin(role);
    }

    // Token metadata functions
    /**
     * Get metadata for a token
     * @param id The token ID
     * @returns The token metadata
     */
    async metadataOf(id: number | bigint): Promise<TokenMetadata> {
        return this.contract.metadataOf(id);
    }

    /**
     * Get metadata for all tokens
     * @returns Array of token metadata
     */
    async metadataOfAll(): Promise<TokenMetadata[]> {
        return this.contract.metadataOfAll();
    }

    /**
     * Get metadata for multiple tokens
     * @param ids Array of token IDs
     * @returns Array of token metadata
     */
    async metadataOfBatch(ids: (number | bigint)[]): Promise<TokenMetadata[]> {
        return this.contract.metadataOfBatch(ids);
    }

    /**
     * Get base metadata for a token
     * @param id The token ID
     * @returns The base token metadata
     */
    async baseMetadataOf(id: number | bigint): Promise<BaseMetadata> {
        return this.contract.baseMetadataOf(id);
    }

    /**
     * Get base metadata for all tokens
     * @returns Array of base token metadata
     */
    async baseMetadataOfAll(): Promise<BaseMetadata[]> {
        return this.contract.baseMetadataOfAll();
    }

    /**
     * Get base metadata for multiple tokens
     * @param ids Array of token IDs
     * @returns Array of base token metadata
     */
    async baseMetadataOfBatch(ids: (number | bigint)[]): Promise<BaseMetadata[]> {
        return this.contract.baseMetadataOfBatch(ids);
    }

    /**
     * Set token metadata
     * @param id The token ID
     * @param active Whether the token is active
     * @param burnable Whether the token is burnable
     * @param transferable Whether the token is transferable
     * @param price The token price
     * @param ttl The token time-to-live
     * @returns The transaction response
     */
    async setMetadata(
        id: number | bigint,
        active: boolean,
        burnable: boolean,
        transferable: boolean,
        price: number | bigint,
        ttl: number | bigint
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.setMetadata(id, active, burnable, transferable, price, ttl);
    }

    /**
     * Set base token metadata
     * @param id The token ID
     * @param active Whether the token is active
     * @param burnable Whether the token is burnable
     * @param transferable Whether the token is transferable
     * @returns The transaction response
     */
    async setBaseMetadata(
        id: number | bigint,
        active: boolean,
        burnable: boolean,
        transferable: boolean
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.setBaseMetadata(id, active, burnable, transferable);
    }

    // Token property accessors
    /**
     * Check if a token is active
     * @param id The token ID
     * @returns True if the token is active, false otherwise
     */
    async active(id: number | bigint): Promise<boolean> {
        return await this.contract.active(id);
    }

    /**
     * Check if a token is burnable
     * @param id The token ID
     * @returns True if the token is burnable, false otherwise
     */
    async burnable(id: number | bigint): Promise<boolean> {
        return await this.contract.burnable(id);
    }

    /**
     * Check if a token is transferable
     * @param id The token ID
     * @returns True if the token is transferable, false otherwise
     */
    async transferable(id: number | bigint): Promise<boolean> {
        return await this.contract.transferable(id);
    }

    /**
     * Check if a token is for sale
     * @param id The token ID
     * @returns True if the token is for sale, false otherwise
     */
    async forSale(id: number | bigint): Promise<boolean> {
        return await this.contract.forSale(id);
    }

    /**
     * Get the price of a token
     * @param id The token ID
     * @returns The token price
     */
    async priceOf(id: number | bigint): Promise<bigint> {
        return await this.contract.priceOf(id);
    }

    /**
     * Get prices for all tokens
     * @returns Array of token prices
     */
    async priceOfAll(): Promise<bigint[]> {
        return await this.contract.priceOfAll();
    }

    /**
     * Get prices for multiple tokens
     * @param ids Array of token IDs
     * @returns Array of token prices
     */
    async priceOfBatch(ids: (number | bigint)[]): Promise<bigint[]> {
        return await this.contract.priceOfBatch(ids);
    }

    /**
     * Set the price of a token
     * @param id The token ID
     * @param price The new price
     * @returns The transaction response
     */
    async setPriceOf(
        id: number | bigint,
        price: number | bigint
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.setPriceOf(id, price);
    }

    /**
     * Set prices for multiple tokens
     * @param ids Array of token IDs
     * @param prices Array of prices
     * @returns The transaction response
     */
    async setPriceOfBatch(
        ids: (number | bigint)[],
        prices: (number | bigint)[]
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.setPriceOfBatch(ids, prices);
    }

    /**
     * Get the time-to-live of a token
     * @param id The token ID
     * @returns The token time-to-live
     */
    async ttlOf(id: number | bigint): Promise<bigint> {
        return await this.contract.ttlOf(id);
    }

    /**
     * Get time-to-live for all tokens
     * @returns Array of token time-to-live values
     */
    async ttlOfAll(): Promise<bigint[]> {
        return await this.contract.ttlOfAll();
    }

    /**
     * Get time-to-live for multiple tokens
     * @param ids Array of token IDs
     * @returns Array of token time-to-live values
     */
    async ttlOfBatch(ids: (number | bigint)[]): Promise<bigint[]> {
        return await this.contract.ttlOfBatch(ids);
    }

    /**
     * Set the time-to-live of a token
     * @param id The token ID
     * @param ttl The new time-to-live
     * @returns The transaction response
     */
    async setTTL(id: number | bigint, ttl: number | bigint): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.setTTL(id, ttl);
    }

    /**
     * Get the expiration time for a token
     * @param id The token ID
     * @returns The token expiration time
     */
    async expirationFor(id: number | bigint): Promise<bigint> {
        return await this.contract.expirationFor(id);
    }

    // Token balance functions
    /**
     * Get the balance of a token for an account
     * @param account The account to check
     * @param id The token ID
     * @returns The token balance
     */
    async balanceOf(account: string, id: number | bigint): Promise<bigint> {
        return await this.contract.balanceOf(account, id);
    }

    /**
     * Get balances for all tokens for an account
     * @param account The account to check
     * @returns Array of token balances
     */
    async balanceOfAll(account: string): Promise<bigint[]> {
        return await this.contract.balanceOfAll(account);
    }

    /**
     * Get balances for multiple tokens and accounts
     * @param accounts Array of accounts
     * @param ids Array of token IDs
     * @returns Array of token balances
     */
    async balanceOfBatch(accounts: string[], ids: (number | bigint)[]): Promise<bigint[]> {
        return await this.contract.balanceOfBatch(accounts, ids);
    }

    /**
     * Get detailed balance information for a token and account
     * @param account The account to check
     * @param id The token ID
     * @returns Array of balance groups with expiration
     */
    async balanceDetailsOf(account: string, id: number | bigint): Promise<Group[]> {
        return this.contract.balanceDetailsOf(account, id);
    }

    /**
     * Get detailed balance information for all tokens for an account
     * @param account The account to check
     * @returns Array of arrays of balance groups with expiration
     */
    async balanceDetailsOfAll(account: string): Promise<Group[][]> {
        return this.contract.balanceDetailsOfAll(account);
    }

    /**
     * Get detailed balance information for multiple tokens and accounts
     * @param accounts Array of accounts
     * @param ids Array of token IDs
     * @returns Array of arrays of balance groups with expiration
     */
    async balanceDetailsOfBatch(accounts: string[], ids: (number | bigint)[]): Promise<Group[][]> {
        return this.contract.balanceDetailsOfBatch(accounts, ids);
    }

    // Token transfer and approval functions
    /**
     * Set approval for all tokens for an operator
     * @param operator The operator to approve
     * @param approved Whether to approve or revoke
     * @returns The transaction response
     */
    async setApprovalForAll(
        operator: string,
        approved: boolean
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.setApprovalForAll(operator, approved);
    }

    /**
     * Check if an operator is approved for all tokens by an account
     * @param account The account to check
     * @param operator The operator to check
     * @returns True if the operator is approved, false otherwise
     */
    async isApprovedForAll(account: string, operator: string): Promise<boolean> {
        return await this.contract.isApprovedForAll(account, operator);
    }

    /**
     * Safely transfer a token from one account to another
     * @param from The sender account
     * @param to The recipient account
     * @param id The token ID
     * @param value The amount to transfer
     * @param data Additional data
     * @returns The transaction response
     */
    async safeTransferFrom(
        from: string,
        to: string,
        id: number | bigint,
        value: number | bigint,
        data = '0x'
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.safeTransferFrom(from, to, id, value, data);
    }

    /**
     * Safely transfer multiple tokens from one account to another
     * @param from The sender account
     * @param to The recipient account
     * @param ids Array of token IDs
     * @param values Array of amounts to transfer
     * @param data Additional data
     * @returns The transaction response
     */
    async safeBatchTransferFrom(
        from: string,
        to: string,
        ids: (number | bigint)[],
        values: (number | bigint)[],
        data = '0x'
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.safeBatchTransferFrom(from, to, ids, values, data);
    }

    // Token minting and burning functions
    /**
     * Issue (mint) tokens to an account
     * @param to The recipient account
     * @param id The token ID
     * @param amount The amount to mint
     * @param data Additional data
     * @returns The transaction response
     */
    async issue(
        to: string,
        id: number | bigint,
        amount: number | bigint,
        data = '0x'
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.issue(to, id, amount, data);
    }

    /**
     * Issue (mint) multiple tokens to an account
     * @param to The recipient account
     * @param ids Array of token IDs
     * @param amounts Array of amounts to mint
     * @param data Additional data
     * @returns The transaction response
     */
    async issueBatch(
        to: string,
        ids: (number | bigint)[],
        amounts: (number | bigint)[],
        data = '0x'
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.issueBatch(to, ids, amounts, data);
    }

    /**
     * Burn tokens from an account
     * @param from The account to burn from
     * @param id The token ID
     * @param amount The amount to burn
     * @returns The transaction response
     */
    async burn(
        from: string,
        id: number | bigint,
        amount: number | bigint
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.burn(from, id, amount);
    }

    /**
     * Burn multiple tokens from an account
     * @param from The account to burn from
     * @param ids Array of token IDs
     * @param amounts Array of amounts to burn
     * @returns The transaction response
     */
    async burnBatch(
        from: string,
        ids: (number | bigint)[],
        amounts: (number | bigint)[]
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.burnBatch(from, ids, amounts);
    }

    // Purchase function
    /**
     * Purchase tokens for an account
     * @param account The recipient account
     * @param id The token ID
     * @param amount The amount to purchase
     * @param paymentAmount The amount to pay
     * @returns The transaction response
     */
    async purchase(
        account: string,
        id: number | bigint,
        amount: number | bigint,
        paymentAmount: number | bigint
    ): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.purchase(account, id, amount, {
            value: paymentAmount,
        });
    }

    // Blacklist management functions
    /**
     * Check if an account is blacklisted
     * @param account The account to check
     * @returns True if the account is blacklisted, false otherwise
     */
    async isBlacklisted(account: string): Promise<boolean> {
        return await this.contract.isBlacklisted(account);
    }

    /**
     * Add an account to the blacklist
     * @param account The account to blacklist
     * @returns The transaction response
     */
    async addToBlacklist(account: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.addToBlacklist(account);
    }

    /**
     * Add multiple accounts to the blacklist
     * @param accounts Array of accounts to blacklist
     * @returns The transaction response
     */
    async addBatchToBlacklist(accounts: string[]): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.addBatchToBlacklist(accounts);
    }

    /**
     * Remove an account from the blacklist
     * @param account The account to remove from the blacklist
     * @returns The transaction response
     */
    async removeFromBlacklist(account: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.removeFromBlacklist(account);
    }

    /**
     * Remove multiple accounts from the blacklist
     * @param accounts Array of accounts to remove from the blacklist
     * @returns The transaction response
     */
    async removeBatchFromBlacklist(accounts: string[]): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.removeBatchFromBlacklist(accounts);
    }

    // Contract admin functions
    /**
     * Get the contract owner
     * @returns The owner address
     */
    async owner(): Promise<string> {
        return await this.contract.owner();
    }

    /**
     * Get the default admin address
     * @returns The default admin address
     */
    async defaultAdmin(): Promise<string> {
        return await this.contract.defaultAdmin();
    }

    /**
     * Get the pending default admin transfer details
     * @returns Object containing the new admin address and schedule time
     */
    async pendingDefaultAdmin(): Promise<{ newAdmin: string; schedule: number }> {
        const [newAdmin, schedule] = await this.contract.pendingDefaultAdmin();
        return { newAdmin, schedule: Number(schedule) };
    }

    /**
     * Begin a default admin transfer
     * @param newAdmin The new admin address
     * @returns The transaction response
     */
    async beginDefaultAdminTransfer(newAdmin: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.beginDefaultAdminTransfer(newAdmin);
    }

    /**
     * Accept a default admin transfer
     * @returns The transaction response
     */
    async acceptDefaultAdminTransfer(): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.acceptDefaultAdminTransfer();
    }

    /**
     * Cancel a default admin transfer
     * @returns The transaction response
     */
    async cancelDefaultAdminTransfer(): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.cancelDefaultAdminTransfer();
    }

    /**
     * Get the default admin delay
     * @returns The default admin delay
     */
    async defaultAdminDelay(): Promise<number> {
        return Number(await this.contract.defaultAdminDelay());
    }

    /**
     * Get the pending default admin delay change details
     * @returns Object containing the new delay and schedule time
     */
    async pendingDefaultAdminDelay(): Promise<{ newDelay: number; schedule: number }> {
        const [newDelay, schedule] = await this.contract.pendingDefaultAdminDelay();
        return { newDelay: Number(newDelay), schedule: Number(schedule) };
    }

    /**
     * Change the default admin delay
     * @param newDelay The new delay
     * @returns The transaction response
     */
    async changeDefaultAdminDelay(newDelay: number): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.changeDefaultAdminDelay(newDelay);
    }

    /**
     * Rollback a default admin delay change
     * @returns The transaction response
     */
    async rollbackDefaultAdminDelay(): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.rollbackDefaultAdminDelay();
    }

    // Contract configuration functions
    /**
     * Get the wallet address
     * @returns The wallet address
     */
    async wallet(): Promise<string> {
        return await this.contract.wallet();
    }

    /**
     * Set the wallet address
     * @param wallet The new wallet address
     * @returns The transaction response
     */
    async setWallet(wallet: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.setWallet(wallet);
    }

    /**
     * Get the URI
     * @param id The token ID
     * @returns The URI
     */
    async uri(id: number | bigint): Promise<string> {
        return await this.contract.uri(id);
    }

    /**
     * Set the URI
     * @param uri The new URI
     * @returns The transaction response
     */
    async setURI(uri: string): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.setURI(uri);
    }

    /**
     * Withdraw funds from the contract
     * @returns The transaction response
     */
    async withdraw(): Promise<ContractTransactionResponse> {
        this.requireSigner();
        return await this.contract.withdraw();
    }

    // Helper functions
    private requireSigner(): void {
        if (!this.signer) {
            throw new Error('Method requires a signer but none was provided');
        }
    }

    // Event listener functions
    /**
     * Listen for token transfers
     * @param callback The callback function
     * @param fromFilter The sender filter (optional)
     * @param toFilter The recipient filter (optional)
     * @returns The event listener
     */
    onTransferSingle(
        callback: (event: unknown) => void,
        fromFilter: string | null = null,
        toFilter: string | null = null
    ): () => void {
        const filter = this.contract.filters.TransferSingle(null, fromFilter, toFilter);

        void this.contract.on(filter, (operator, from, to, id, value, event) => {
            callback({
                operator,
                from,
                to,
                id,
                value,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for batch token transfers
     * @param callback The callback function
     * @param fromFilter The sender filter (optional)
     * @param toFilter The recipient filter (optional)
     * @returns The event listener
     */
    onTransferBatch(
        callback: (event: unknown) => void,
        fromFilter: string | null = null,
        toFilter: string | null = null
    ): () => void {
        const filter = this.contract.filters.TransferBatch(null, fromFilter, toFilter);

        void this.contract.on(filter, (operator, from, to, ids, values, event) => {
            callback({
                operator,
                from,
                to,
                ids,
                values,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for approval events
     * @param callback The callback function
     * @param accountFilter The account filter (optional)
     * @param operatorFilter The operator filter (optional)
     * @returns The event listener
     */
    onApprovalForAll(
        callback: (event: unknown) => void,
        accountFilter: string | null = null,
        operatorFilter: string | null = null
    ): () => void {
        const filter = this.contract.filters.ApprovalForAll(accountFilter, operatorFilter);

        void this.contract.on(filter, (account, operator, approved, event) => {
            callback({
                account,
                operator,
                approved,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for token metadata update events
     * @param callback The callback function
     * @param idFilter The token ID filter (optional)
     * @returns The event listener
     */
    onTokenMetadataUpdated(
        callback: (event: unknown) => void,
        idFilter: number | bigint | null = null
    ): () => void {
        const filter = this.contract.filters.TokenMetadataUpdated(idFilter);

        void this.contract.on(filter, (id, oldMetadata, newMetadata, event) => {
            callback({
                id,
                oldMetadata: oldMetadata as TokenMetadata,
                newMetadata: newMetadata as TokenMetadata,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for token purchase events
     * @param callback The callback function
     * @param accountFilter The account filter (optional)
     * @param idFilter The token ID filter (optional)
     * @returns The event listener
     */
    onTokenPurchased(
        callback: (event: unknown) => void,
        accountFilter: string | null = null,
        idFilter: number | bigint | null = null
    ): () => void {
        const filter = this.contract.filters.TokenPurchased(accountFilter, idFilter);

        void this.contract.on(filter, (account, id, amount, event) => {
            callback({
                account,
                id,
                amount,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for blacklist events
     * @param callback The callback function
     * @param accountFilter The account filter (optional)
     * @returns The event listener
     */
    onAddedToBlacklist(
        callback: (event: unknown) => void,
        accountFilter: string | null = null
    ): () => void {
        const filter = this.contract.filters.AddedToBlacklist(accountFilter);

        void this.contract.on(filter, (account, event) => {
            callback({
                account,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for removal from blacklist events
     * @param callback The callback function
     * @param accountFilter The account filter (optional)
     * @returns The event listener
     */
    onRemovedFromBlacklist(
        callback: (event: unknown) => void,
        accountFilter: string | null = null
    ): () => void {
        const filter = this.contract.filters.RemovedFromBlacklist(accountFilter);

        void this.contract.on(filter, (account, event) => {
            callback({
                account,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for expired tokens burned events
     * @param callback The callback function
     * @param accountFilter The account filter (optional)
     * @param idFilter The token ID filter (optional)
     * @returns The event listener
     */
    onExpiredTokensBurned(
        callback: (event: unknown) => void,
        accountFilter: string | null = null,
        idFilter: number | bigint | null = null
    ): () => void {
        const filter = this.contract.filters.ExpiredTokensBurned(accountFilter, idFilter);

        void this.contract.on(filter, (account, id, amount, event) => {
            callback({
                account,
                id,
                amount,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for funds withdrawn events
     * @param callback The callback function
     * @param walletFilter The wallet filter (optional)
     * @returns The event listener
     */
    onFundsWithdrawn(
        callback: (event: unknown) => void,
        walletFilter: string | null = null
    ): () => void {
        const filter = this.contract.filters.FundsWithdrawn(walletFilter);

        void this.contract.on(filter, (wallet, amount, event) => {
            callback({
                wallet,
                amount,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for role granted events
     * @param callback The callback function
     * @param roleFilter The role filter (optional)
     * @param accountFilter The account filter (optional)
     * @returns The event listener
     */
    onRoleGranted(
        callback: (event: unknown) => void,
        roleFilter: string | null = null,
        accountFilter: string | null = null
    ): () => void {
        const filter = this.contract.filters.RoleGranted(roleFilter, accountFilter);

        void this.contract.on(filter, (role, account, sender, event) => {
            callback({
                role,
                account,
                sender,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }

    /**
     * Listen for role revoked events
     * @param roleFilter The role filter (optional)
     * @param accountFilter The account filter (optional)
     * @param callback The callback function
     * @returns The event listener
     */
    onRoleRevoked(
        callback: (event: unknown) => void,
        roleFilter: string | null = null,
        accountFilter: string | null = null
    ): () => void {
        const filter = this.contract.filters.RoleRevoked(roleFilter, accountFilter);

        void this.contract.on(filter, (role, account, sender, event) => {
            callback({
                role,
                account,
                sender,
                event,
            });
        });

        return () => {
            void this.contract.off(filter, callback);
        };
    }
}
