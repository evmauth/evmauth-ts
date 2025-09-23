import {
    http,
    type Account,
    type Address,
    type GetBlockReturnType,
    type Hex,
    type PublicClient,
    type TestClient,
    type WalletClient,
    createPublicClient,
    createTestClient,
    createWalletClient,
    keccak256,
    parseEther,
    toHex,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';

export const ANVIL_URL = process.env.ANVIL_URL || 'http://127.0.0.1:8545';

export class Anvil {
    public publicClient: PublicClient;
    private activePrank: Address | null = null;
    private testClient: TestClient;

    constructor() {
        this.publicClient = createPublicClient({
            chain: foundry,
            transport: http(ANVIL_URL),
        });
        this.testClient = createTestClient({
            chain: foundry,
            transport: http(ANVIL_URL),
            mode: 'anvil',
        });
    }

    /**
     * Create a wallet client for an account
     * If account is a string, create a deterministic account from it
     * If account is an empty string, create a random account
     */
    createWalletClient(account: Account | string = ''): WalletClient {
        return createWalletClient({
            account: typeof account === 'string' ? this.makeAddr(account) : account,
            chain: foundry,
            transport: http(ANVIL_URL),
        });
    }

    /**
     * Create an account from a string (Forge: makeAddr)
     * If text is an empty string, create a random account
     */
    makeAddr(text = ''): Account {
        // Create a deterministic private key from the string by hashing it
        const privateKey = text ? keccak256(toHex(text)) : generatePrivateKey();
        return privateKeyToAccount(privateKey);
    }

    /**
     * Set ETH balance for an address (Forge: vm.deal)
     */
    async deal(account: Address, amount: bigint | string) {
        const value = typeof amount === 'string' ? parseEther(amount) : amount;
        await this.testClient.setBalance({ address: account, value });
    }

    /**
     * Set block timestamp (Forge: vm.warp)
     */
    async warp(timestamp: number | bigint) {
        await this.testClient.setNextBlockTimestamp({ timestamp: BigInt(timestamp) });
        await this.testClient.mine({ blocks: 1 });
    }

    /**
     * Increase time by seconds
     */
    async skip(seconds: number | bigint) {
        await this.testClient.increaseTime({ seconds: Number(seconds) });
        const newTimestamp = (await this.publicClient.getBlock()).timestamp + BigInt(seconds);
        await this.warp(newTimestamp);
    }

    /**
     * Get the latest block (Forge: block)
     * @returns The latest block
     */
    async block(): Promise<GetBlockReturnType> {
        return await this.publicClient.getBlock();
    }

    /**
     * Impersonate account for one transaction (Forge: vm.prank)
     */
    async prank(account: Address) {
        await this.testClient.impersonateAccount({ address: account });
        this.activePrank = account;
    }

    /**
     * Start persistent impersonation (Forge: vm.startPrank)
     */
    async startPrank(account: Address) {
        await this.testClient.impersonateAccount({ address: account });
        this.activePrank = account;
    }

    /**
     * Stop impersonation (Forge: vm.stopPrank)
     */
    async stopPrank() {
        if (this.activePrank) {
            await this.testClient.stopImpersonatingAccount({ address: this.activePrank });
            this.activePrank = null;
        }
    }

    /**
     * Create snapshot (Forge: vm.snapshot)
     */
    async snapshot(): Promise<Hex> {
        return await this.testClient.snapshot();
    }

    /**
     * Revert to snapshot (Forge: vm.revertTo)
     */
    async revertTo(snapshotId: Hex): Promise<boolean> {
        await this.testClient.revert({ id: snapshotId });
        return true;
    }

    /**
     * Set contract code at address (Forge: vm.etch)
     */
    async etch(account: Address, bytecode: Hex) {
        await this.testClient.setCode({ address: account, bytecode });
    }

    /**
     * Store value at storage slot (Forge: vm.store)
     */
    async store(account: Address, slot: Hex, value: Hex) {
        await this.testClient.setStorageAt({
            address: account,
            index: slot,
            value,
        });
    }

    /**
     * Load value from storage slot (Forge: vm.load)
     */
    async load(account: Address, slot: Hex): Promise<Hex | undefined> {
        return await this.publicClient.getStorageAt({
            address: account,
            slot,
        });
    }

    /**
     * Set nonce for account (Forge: vm.setNonce)
     */
    async setNonce(account: Address, nonce: number) {
        await this.testClient.setNonce({ address: account, nonce });
    }

    /**
     * Get nonce for account (Forge: vm.getNonce)
     */
    async getNonce(account: Address): Promise<bigint> {
        const nonce = await this.publicClient.getTransactionCount({ address: account });
        return BigInt(nonce);
    }

    /**
     * Reset to fresh state (Forge: vm.resetNonce)
     */
    async reset() {
        await this.testClient.reset();
    }

    /**
     * Set coinbase address (Forge: vm.coinbase)
     */
    async coinbase(account: Address) {
        await this.testClient.setCoinbase({ address: account });
    }

    /**
     * Set base fee (Forge: vm.fee)
     */
    async fee(baseFee: bigint) {
        await this.testClient.setNextBlockBaseFeePerGas({ baseFeePerGas: baseFee });
    }

    /**
     * Set block gas limit (Forge: vm.setBlockGasLimit)
     */
    async setBlockGasLimit(gasLimit: bigint) {
        await this.testClient.setBlockGasLimit({ gasLimit });
    }

    /**
     * Set minimum gas price (Forge: vm.txGasPrice)
     */
    async txGasPrice(gasPrice: bigint) {
        await this.testClient.setMinGasPrice({ gasPrice });
    }
}

export const vm = new Anvil();
