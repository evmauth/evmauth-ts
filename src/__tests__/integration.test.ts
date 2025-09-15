import {
    http,
    type Address,
    type PublicClient,
    type WalletClient,
    createPublicClient,
    createWalletClient,
    parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import { beforeAll, describe, expect, it } from 'vitest';
import {
    createAccessManagerSDK1155,
    createAdminSDK1155,
    createBurnerSDK1155,
    // New SDK imports
    createClientSDK1155,
    createClientSDK6909,
    createMinterSDK1155,
    createTokenManagerSDK1155,
    createTokenManagerSDK6909,
    createTreasurerSDK1155,
    // Helper function to get contract instance for direct access to specific methods
    getEVMAuth6909,
} from '../index.js';
import { deployEVMAuth1155, deployEVMAuth6909 } from './deploy-helpers.js';

// Test configuration
const ANVIL_URL = 'http://127.0.0.1:8545';

// Anvil test accounts with human-friendly names
const ALICE_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil account 0
const BOB_PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'; // Anvil account 1
const CAROL_PRIVATE_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'; // Anvil account 2

describe('EVMAuth SDK Integration Tests', () => {
    let publicClient: PublicClient;
    let aliceWallet: WalletClient;
    let alice: Address;
    let bob: Address;
    let carol: Address;
    let evmAuth1155Address: Address;
    let evmAuth6909Address: Address;

    beforeAll(async () => {
        // Set up clients
        publicClient = createPublicClient({
            chain: foundry,
            transport: http(ANVIL_URL),
        });

        // Set up accounts
        const aliceAccount = privateKeyToAccount(ALICE_PRIVATE_KEY);
        const bobAccount = privateKeyToAccount(BOB_PRIVATE_KEY);
        const carolAccount = privateKeyToAccount(CAROL_PRIVATE_KEY);

        // Create wallet client for Alice (primary test account)
        aliceWallet = createWalletClient({
            account: aliceAccount,
            chain: foundry,
            transport: http(ANVIL_URL),
        });

        // Store addresses
        alice = aliceAccount.address;
        bob = bobAccount.address;
        carol = carolAccount.address;

        // Deploy the contracts using Alice's wallet
        console.log('Deploying EVMAuth1155...');
        evmAuth1155Address = await deployEVMAuth1155(publicClient, aliceWallet, {
            uri: 'https://example.com/metadata/',
        });
        console.log('EVMAuth1155 deployed at:', evmAuth1155Address);

        console.log('Deploying EVMAuth6909...');
        evmAuth6909Address = await deployEVMAuth6909(publicClient, aliceWallet, {
            uri: 'https://example.com/metadata/',
        });
        console.log('EVMAuth6909 deployed at:', evmAuth6909Address);
    });

    describe('SDK Factory Functions', () => {
        it('should create ClientSDK for EVMAuth1155', () => {
            const clientSDK = createClientSDK1155(evmAuth1155Address, aliceWallet);
            expect(clientSDK).toBeDefined();
            expect(clientSDK.address).toBe(evmAuth1155Address);
        });

        it('should create ClientSDK for EVMAuth6909', () => {
            const clientSDK = createClientSDK6909(evmAuth6909Address, aliceWallet);
            expect(clientSDK).toBeDefined();
            expect(clientSDK.address).toBe(evmAuth6909Address);
        });

        it('should create TokenManagerSDK for EVMAuth1155', () => {
            const tokenManagerSDK = createTokenManagerSDK1155(evmAuth1155Address, aliceWallet);
            expect(tokenManagerSDK).toBeDefined();
            expect(tokenManagerSDK.address).toBe(evmAuth1155Address);
        });

        it('should create all role-based SDKs', () => {
            const adminSDK = createAdminSDK1155(evmAuth1155Address, aliceWallet);
            const accessManagerSDK = createAccessManagerSDK1155(evmAuth1155Address, aliceWallet);
            const minterSDK = createMinterSDK1155(evmAuth1155Address, aliceWallet);
            const burnerSDK = createBurnerSDK1155(evmAuth1155Address, aliceWallet);
            const treasurerSDK = createTreasurerSDK1155(evmAuth1155Address, aliceWallet);

            expect(adminSDK).toBeDefined();
            expect(accessManagerSDK).toBeDefined();
            expect(minterSDK).toBeDefined();
            expect(burnerSDK).toBeDefined();
            expect(treasurerSDK).toBeDefined();
        });
    });

    describe('Reading from Blockchain', () => {
        it('should connect to Anvil and get chain ID', async () => {
            const chainId = await publicClient.getChainId();
            expect(chainId).toBe(31337); // Anvil's default chain ID
        });

        it("should get Alice's balance", async () => {
            const balance = await publicClient.getBalance({ address: alice });
            expect(balance).toBeGreaterThan(0n);
        });
    });

    describe('TokenManagerSDK - EVMAuth1155', () => {
        let tokenId: bigint;
        let tokenManagerSDK: ReturnType<typeof createTokenManagerSDK1155>;

        beforeAll(async () => {
            tokenManagerSDK = createTokenManagerSDK1155(evmAuth1155Address, aliceWallet);

            // Create a token using TokenManagerSDK
            console.log('Creating token with TokenManagerSDK...');
            const createResult = await tokenManagerSDK.createToken({
                price: parseEther('0.1'),
                ttl: 30n * 24n * 60n * 60n, // 30 days
                transferable: true,
            });

            await publicClient.waitForTransactionReceipt({ hash: createResult.hash });
            tokenId = await createResult.getTokenId(publicClient);
            console.log('Created token with ID:', tokenId);
        });

        it('should get token configuration', async () => {
            const config = await tokenManagerSDK.tokenConfig(tokenId);
            expect(config.price).toBe(parseEther('0.1'));
            expect(config.ttl).toBe(30n * 24n * 60n * 60n);
            expect(config.transferable).toBe(true);
        });

        it('should check token price', async () => {
            const price = await tokenManagerSDK.tokenPrice(tokenId);
            expect(price).toBe(parseEther('0.1'));
        });

        it('should check if token is transferable', async () => {
            const isTransferable = await tokenManagerSDK.isTransferable(tokenId);
            expect(isTransferable).toBe(true);
        });

        it('should check if token exists', async () => {
            const exists = await tokenManagerSDK.exists(tokenId);
            expect(exists).toBe(true);
        });
    });

    describe('ClientSDK - EVMAuth1155 Purchases', () => {
        let tokenId: bigint;
        let tokenManagerSDK: ReturnType<typeof createTokenManagerSDK1155>;
        let clientSDK: ReturnType<typeof createClientSDK1155>;

        beforeAll(async () => {
            tokenManagerSDK = createTokenManagerSDK1155(evmAuth1155Address, aliceWallet);
            clientSDK = createClientSDK1155(evmAuth1155Address, aliceWallet);

            // Create a token
            const createResult = await tokenManagerSDK.createToken({
                price: parseEther('0.05'),
                ttl: 7n * 24n * 60n * 60n, // 7 days
                transferable: true,
            });

            await publicClient.waitForTransactionReceipt({ hash: createResult.hash });
            tokenId = await createResult.getTokenId(publicClient);
        });

        it('should allow Alice to purchase tokens with native currency', async () => {
            const hash = await clientSDK.purchaseWithNative(tokenId, 5n);
            expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Verify Alice's balance
            const balance = await clientSDK.balanceOf(alice, tokenId);
            expect(balance).toBeGreaterThanOrEqual(5n);
        });

        it("should check Alice's balance after purchase", async () => {
            const hasBalance = await clientSDK.hasActiveBalance(alice, tokenId, 1n);
            expect(hasBalance).toBe(true);

            const hasExcessBalance = await clientSDK.hasActiveBalance(alice, tokenId, 1000n);
            expect(hasExcessBalance).toBe(false);
        });

        it('should allow Alice to purchase tokens for Bob', async () => {
            const hash = await clientSDK.purchaseForWithNative(bob, tokenId, 3n);
            expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Check Bob's balance
            const balance = await clientSDK.balanceOf(bob, tokenId);
            expect(balance).toBeGreaterThanOrEqual(3n);
        });

        it('should check if ERC20 payment is accepted', async () => {
            const randomERC20 = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address;
            const isAccepted = await clientSDK.canPurchaseWithERC20(tokenId, randomERC20);
            expect(typeof isAccepted).toBe('boolean');
            expect(isAccepted).toBe(false); // Should be false since we didn't configure any ERC20 prices
        });

        it("should get Alice's balance records", async () => {
            const records = await clientSDK.balanceRecordsOf(alice, tokenId);
            expect(Array.isArray(records)).toBe(true);
            expect(records.length).toBeGreaterThan(0);

            // Check structure of balance records
            if (records.length > 0) {
                expect(records[0]).toHaveProperty('amount');
                expect(records[0]).toHaveProperty('expiresAt');
            }
        });
    });

    describe('ClientSDK - EVMAuth1155 Transfers', () => {
        let tokenId: bigint;
        let tokenManagerSDK: ReturnType<typeof createTokenManagerSDK1155>;
        let clientSDK: ReturnType<typeof createClientSDK1155>;

        beforeAll(async () => {
            tokenManagerSDK = createTokenManagerSDK1155(evmAuth1155Address, aliceWallet);
            clientSDK = createClientSDK1155(evmAuth1155Address, aliceWallet);

            // Create a transferable token
            const createResult = await tokenManagerSDK.createToken({
                price: parseEther('0.01'),
                ttl: 24n * 60n * 60n, // 1 day
                transferable: true,
            });

            await publicClient.waitForTransactionReceipt({ hash: createResult.hash });
            tokenId = await createResult.getTokenId(publicClient);

            // Alice purchases some tokens
            const purchaseHash = await clientSDK.purchaseWithNative(tokenId, 10n);
            await publicClient.waitForTransactionReceipt({ hash: purchaseHash });
        });

        it('should allow Alice to transfer tokens to Bob', async () => {
            // Get initial balances
            const aliceBalanceBefore = await clientSDK.balanceOf(alice, tokenId);
            const bobBalanceBefore = await clientSDK.balanceOf(bob, tokenId);

            // Alice transfers 2 tokens to Bob
            const transferAmount = 2n;
            const hash = await clientSDK.safeTransferFrom({
                from: alice,
                to: bob,
                tokenId,
                amount: transferAmount,
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Verify balances after transfer
            const aliceBalanceAfter = await clientSDK.balanceOf(alice, tokenId);
            const bobBalanceAfter = await clientSDK.balanceOf(bob, tokenId);

            expect(aliceBalanceAfter).toBe(aliceBalanceBefore - transferAmount);
            expect(bobBalanceAfter).toBe(bobBalanceBefore + transferAmount);
        });

        it('should allow Alice to approve Bob for all tokens', async () => {
            const hash = await clientSDK.setApprovalForAll(bob, true);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            const isApproved = await clientSDK.isApprovedForAll(alice, bob);
            expect(isApproved).toBe(true);

            // Alice revokes Bob's approval
            const revokeHash = await clientSDK.setApprovalForAll(bob, false);
            const revokeReceipt = await publicClient.waitForTransactionReceipt({
                hash: revokeHash,
            });
            expect(revokeReceipt.status).toBe('success');

            const isApprovedAfter = await clientSDK.isApprovedForAll(alice, bob);
            expect(isApprovedAfter).toBe(false);
        });
    });

    describe('TokenManagerSDK - EVMAuth6909', () => {
        let tokenId: bigint;
        let tokenManagerSDK: ReturnType<typeof createTokenManagerSDK6909>;

        beforeAll(async () => {
            tokenManagerSDK = createTokenManagerSDK6909(evmAuth6909Address, aliceWallet);

            // Create a non-transferable token
            console.log('Creating ERC6909 token with TokenManagerSDK...');
            const createResult = await tokenManagerSDK.createToken({
                price: parseEther('0.05'),
                ttl: 7n * 24n * 60n * 60n, // 7 days
                transferable: false, // Non-transferable
            });

            await publicClient.waitForTransactionReceipt({ hash: createResult.hash });
            tokenId = await createResult.getTokenId(publicClient);
            console.log('Created ERC6909 token with ID:', tokenId);
        });

        it('should get token configuration', async () => {
            const config = await tokenManagerSDK.tokenConfig(tokenId);
            expect(config.price).toBe(parseEther('0.05'));
            expect(config.ttl).toBe(7n * 24n * 60n * 60n);
            expect(config.transferable).toBe(false);
        });

        it('should get next token ID', async () => {
            const nextId = await tokenManagerSDK.nextTokenID();
            expect(nextId).toBeGreaterThan(tokenId);
        });
    });

    describe('ClientSDK - EVMAuth6909 Operations', () => {
        let tokenId: bigint;
        let tokenManagerSDK: ReturnType<typeof createTokenManagerSDK6909>;
        let clientSDK: ReturnType<typeof createClientSDK6909>;
        let contract: ReturnType<typeof getEVMAuth6909>;

        beforeAll(async () => {
            tokenManagerSDK = createTokenManagerSDK6909(evmAuth6909Address, aliceWallet);
            clientSDK = createClientSDK6909(evmAuth6909Address, aliceWallet);
            contract = getEVMAuth6909(evmAuth6909Address, aliceWallet);

            // Create a token
            const createResult = await tokenManagerSDK.createToken({
                price: parseEther('0.02'),
                ttl: 3n * 24n * 60n * 60n, // 3 days
                transferable: false,
            });

            await publicClient.waitForTransactionReceipt({ hash: createResult.hash });
            tokenId = await createResult.getTokenId(publicClient);
        });

        it('should allow Alice to purchase tokens with native currency', async () => {
            const hash = await clientSDK.purchaseWithNative(tokenId, 10n);
            expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Verify Alice's balance
            const balance = await clientSDK.balanceOf(alice, tokenId);
            expect(balance).toBeGreaterThanOrEqual(10n);
        });

        it('should get token metadata using contract', async () => {
            // Note: ERC6909 specific methods need to be accessed through the contract directly
            // as they're not part of the generic ClientSDK
            const name = await contract.read.name([tokenId]);
            expect(typeof name).toBe('string');

            const symbol = await contract.read.symbol([tokenId]);
            expect(typeof symbol).toBe('string');

            const decimals = await contract.read.decimals([tokenId]);
            expect(typeof decimals).toBe('number');
        });

        it('should handle token approvals for ERC6909', async () => {
            // Alice approves Bob for 5 tokens
            const approvalAmount = 5n;

            const hash = await contract.write.approve([bob, tokenId, approvalAmount]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Check allowance from Alice to Bob
            const allowance = await contract.read.allowance([alice, bob, tokenId]);
            expect(allowance).toBe(approvalAmount);
        });

        it('should check if token exists', async () => {
            const exists = await clientSDK.exists(tokenId);
            expect(exists).toBe(true);

            const doesNotExist = await clientSDK.exists(999999n);
            expect(doesNotExist).toBe(false);
        });
    });

    describe('Multi-user Interactions', () => {
        let tokenId: bigint;
        let tokenManagerSDK: ReturnType<typeof createTokenManagerSDK1155>;
        let clientSDK: ReturnType<typeof createClientSDK1155>;

        beforeAll(async () => {
            tokenManagerSDK = createTokenManagerSDK1155(evmAuth1155Address, aliceWallet);
            clientSDK = createClientSDK1155(evmAuth1155Address, aliceWallet);

            // Create a token
            const createResult = await tokenManagerSDK.createToken({
                price: parseEther('0.01'),
                ttl: 24n * 60n * 60n, // 1 day
                transferable: true,
            });

            await publicClient.waitForTransactionReceipt({ hash: createResult.hash });
            tokenId = await createResult.getTokenId(publicClient);
        });

        it('should allow Alice to purchase tokens for both Bob and Carol', async () => {
            // Alice buys tokens for Bob
            const bobHash = await clientSDK.purchaseForWithNative(bob, tokenId, 5n);
            await publicClient.waitForTransactionReceipt({ hash: bobHash });

            // Alice buys tokens for Carol
            const carolHash = await clientSDK.purchaseForWithNative(carol, tokenId, 3n);
            await publicClient.waitForTransactionReceipt({ hash: carolHash });

            // Verify balances
            const bobBalance = await clientSDK.balanceOf(bob, tokenId);
            const carolBalance = await clientSDK.balanceOf(carol, tokenId);

            expect(bobBalance).toBeGreaterThanOrEqual(5n);
            expect(carolBalance).toBeGreaterThanOrEqual(3n);
        });

        it('should track balances for multiple users', async () => {
            // Alice buys some for herself
            const aliceHash = await clientSDK.purchaseWithNative(tokenId, 10n);
            await publicClient.waitForTransactionReceipt({ hash: aliceHash });

            // Get all balances
            const aliceBalance = await clientSDK.balanceOf(alice, tokenId);
            const bobBalance = await clientSDK.balanceOf(bob, tokenId);
            const carolBalance = await clientSDK.balanceOf(carol, tokenId);

            // Everyone should have some tokens
            expect(aliceBalance).toBeGreaterThan(0n);
            expect(bobBalance).toBeGreaterThan(0n);
            expect(carolBalance).toBeGreaterThan(0n);
        });
    });

    describe('SDK Read-only Mode', () => {
        it('should work with PublicClient for read operations', async () => {
            const readOnlyClientSDK = createClientSDK1155(evmAuth1155Address, publicClient);

            // Read operations should work
            const owner = await readOnlyClientSDK.owner();
            expect(owner).toBeDefined();

            // Write operations should throw
            await expect(async () => {
                await readOnlyClientSDK.purchaseWithNative(1n, 1n);
            }).rejects.toThrow('read-only');
        });

        it('should check write capability', () => {
            const readOnlySDK = createClientSDK1155(evmAuth1155Address, publicClient);
            const writeSDK = createClientSDK1155(evmAuth1155Address, aliceWallet);

            expect(readOnlySDK.canWrite()).toBe(false);
            expect(writeSDK.canWrite()).toBe(true);
        });
    });
});
