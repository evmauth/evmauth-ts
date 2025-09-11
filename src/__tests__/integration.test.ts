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
    canPurchaseWithERC20,
    getEVMAuth1155,
    getEVMAuth6909,
    getTokenIdFromCreation,
    hasActiveBalance,
    purchaseForWithNative,
    purchaseWithNative,
} from '../index.js';
import type { EVMAuthTokenConfig } from '../types.js';
import { deployEVMAuth1155, deployEVMAuth6909 } from './deploy-helpers.js';

// Test configuration
const ANVIL_URL = 'http://127.0.0.1:8545';
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Anvil account 0
const TEST_PRIVATE_KEY_2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'; // Anvil account 1

describe('EVMAuth SDK Integration Tests', () => {
    let publicClient: PublicClient;
    let walletClient: WalletClient;
    let account: Address;
    let recipientAccount: Address;
    let evmAuth1155Address: Address;
    let evmAuth6909Address: Address;

    beforeAll(async () => {
        // Set up clients
        publicClient = createPublicClient({
            chain: foundry,
            transport: http(ANVIL_URL),
        });

        const accountObj = privateKeyToAccount(TEST_PRIVATE_KEY);
        const recipientAccountObj = privateKeyToAccount(TEST_PRIVATE_KEY_2);

        walletClient = createWalletClient({
            account: accountObj,
            chain: foundry,
            transport: http(ANVIL_URL),
        });

        account = accountObj.address;
        recipientAccount = recipientAccountObj.address;

        // Deploy the contracts
        console.log('Deploying EVMAuth1155...');
        evmAuth1155Address = await deployEVMAuth1155(publicClient, walletClient, {
            uri: 'https://example.com/metadata/',
        });
        console.log('EVMAuth1155 deployed at:', evmAuth1155Address);

        console.log('Deploying EVMAuth6909...');
        evmAuth6909Address = await deployEVMAuth6909(publicClient, walletClient, {
            uri: 'https://example.com/metadata/',
        });
        console.log('EVMAuth6909 deployed at:', evmAuth6909Address);
    });

    describe('Contract Connection', () => {
        it('should create an EVMAuth1155 contract instance', () => {
            const contract = getEVMAuth1155(evmAuth1155Address, walletClient);
            expect(contract).toBeDefined();
            expect(contract.address).toBe(evmAuth1155Address);
        });

        it('should create an EVMAuth6909 contract instance', () => {
            const contract = getEVMAuth6909(evmAuth6909Address, walletClient);
            expect(contract).toBeDefined();
            expect(contract.address).toBe(evmAuth6909Address);
        });
    });

    describe('Reading from Blockchain', () => {
        it('should connect to Anvil and get chain ID', async () => {
            const chainId = await publicClient.getChainId();
            expect(chainId).toBe(31337); // Anvil's default chain ID
        });

        it('should get account balance', async () => {
            const balance = await publicClient.getBalance({ address: account });
            expect(balance).toBeGreaterThan(0n);
        });
    });

    describe('EVMAuth1155 Contract Interactions', () => {
        let tokenId: bigint;
        let contract: ReturnType<typeof getEVMAuth1155>;

        beforeAll(async () => {
            contract = getEVMAuth1155(evmAuth1155Address, walletClient);

            // Create a token
            const config: EVMAuthTokenConfig = {
                price: parseEther('0.1'),
                erc20Prices: [],
                ttl: 30n * 24n * 60n * 60n, // 30 days
                transferable: true,
            };

            console.log('Creating token...');
            const hash = await contract.write.createToken([config]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            tokenId = getTokenIdFromCreation(receipt);
            console.log('Created token with ID:', tokenId);
        });

        it('should get token configuration', async () => {
            const token = await contract.read.tokenConfig([tokenId]);
            expect(token.config.price).toBe(parseEther('0.1'));
            expect(token.config.ttl).toBe(30n * 24n * 60n * 60n);
            expect(token.config.transferable).toBe(true);
        });

        it('should purchase tokens with native currency', async () => {
            const hash = await purchaseWithNative(contract, tokenId, 5n);
            expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Verify balance
            const balance = await contract.read.balanceOf([account, tokenId]);
            expect(balance).toBeGreaterThanOrEqual(5n);
        });

        it('should check balance after purchase', async () => {
            const hasBalance = await hasActiveBalance(contract, account, tokenId, 1n);
            expect(hasBalance).toBe(true);

            const hasExcessBalance = await hasActiveBalance(contract, account, tokenId, 1000n);
            expect(hasExcessBalance).toBe(false);
        });

        it('should purchase tokens for another address', async () => {
            const hash = await purchaseForWithNative(contract, recipientAccount, tokenId, 3n);
            expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Check recipient's balance
            const balance = await contract.read.balanceOf([recipientAccount, tokenId]);
            expect(balance).toBeGreaterThanOrEqual(3n);
        });

        it('should check if ERC20 payment is accepted', async () => {
            const randomERC20 = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address;
            const isAccepted = await canPurchaseWithERC20(contract, tokenId, randomERC20);
            expect(typeof isAccepted).toBe('boolean');
            expect(isAccepted).toBe(false); // Should be false since we didn't configure any ERC20 prices
        });

        it('should transfer tokens if transferable', async () => {
            // First check if the token is transferable
            const token = await contract.read.tokenConfig([tokenId]);
            expect(token.config.transferable).toBe(true);

            // Get initial balances
            const senderBalanceBefore = await contract.read.balanceOf([account, tokenId]);
            const recipientBalanceBefore = await contract.read.balanceOf([
                recipientAccount,
                tokenId,
            ]);

            // Transfer 2 tokens
            const transferAmount = 2n;
            const hash = await contract.write.safeTransferFrom([
                account,
                recipientAccount,
                tokenId,
                transferAmount,
                '0x',
            ]);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Verify balances after transfer
            const senderBalanceAfter = await contract.read.balanceOf([account, tokenId]);
            const recipientBalanceAfter = await contract.read.balanceOf([
                recipientAccount,
                tokenId,
            ]);

            expect(senderBalanceAfter).toBe(senderBalanceBefore - transferAmount);
            expect(recipientBalanceAfter).toBe(recipientBalanceBefore + transferAmount);
        });
    });

    describe('EVMAuth6909 Contract Interactions', () => {
        let tokenId: bigint;
        let contract: ReturnType<typeof getEVMAuth6909>;

        beforeAll(async () => {
            contract = getEVMAuth6909(evmAuth6909Address, walletClient);

            // Create a token
            const config: EVMAuthTokenConfig = {
                price: parseEther('0.05'),
                erc20Prices: [],
                ttl: 7n * 24n * 60n * 60n, // 7 days
                transferable: false, // Non-transferable for this test
            };

            console.log('Creating ERC6909 token...');
            const hash = await contract.write.createToken([config]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            tokenId = getTokenIdFromCreation(receipt);
            console.log('Created ERC6909 token with ID:', tokenId);
        });

        it('should get token configuration', async () => {
            const token = await contract.read.tokenConfig([tokenId]);
            expect(token.config.price).toBe(parseEther('0.05'));
            expect(token.config.ttl).toBe(7n * 24n * 60n * 60n);
            expect(token.config.transferable).toBe(false);
        });

        it('should purchase tokens with native currency', async () => {
            const hash = await purchaseWithNative(contract, tokenId, 10n);
            expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Verify balance
            const balance = await contract.read.balanceOf([account, tokenId]);
            expect(balance).toBeGreaterThanOrEqual(10n);
        });

        it('should get token metadata', async () => {
            const name = await contract.read.name([tokenId]);
            expect(typeof name).toBe('string');

            const symbol = await contract.read.symbol([tokenId]);
            expect(typeof symbol).toBe('string');

            const decimals = await contract.read.decimals([tokenId]);
            expect(typeof decimals).toBe('number');
        });

        it('should not allow transfers if non-transferable', async () => {
            const token = await contract.read.tokenConfig([tokenId]);
            expect(token.config.transferable).toBe(false);

            // Attempting to transfer should fail
            try {
                await contract.write.transfer([recipientAccount, tokenId, 1n]);
                expect.fail('Transfer should have failed for non-transferable token');
            } catch (error) {
                // Expected to fail
                expect(error).toBeDefined();
            }
        });

        it('should handle token approvals', async () => {
            // Set approval for a spender
            const spenderAddress = recipientAccount;
            const approvalAmount = 5n;

            const hash = await contract.write.approve([spenderAddress, tokenId, approvalAmount]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            expect(receipt.status).toBe('success');

            // Check allowance
            const allowance = await contract.read.allowance([account, spenderAddress, tokenId]);
            expect(allowance).toBe(approvalAmount);
        });
    });

    describe('Helper Functions', () => {
        let contract1155: ReturnType<typeof getEVMAuth1155>;
        let contract6909: ReturnType<typeof getEVMAuth6909>;
        let tokenId1155: bigint;
        let tokenId6909: bigint;

        beforeAll(async () => {
            contract1155 = getEVMAuth1155(evmAuth1155Address, walletClient);
            contract6909 = getEVMAuth6909(evmAuth6909Address, walletClient);

            // Create test tokens
            const config: EVMAuthTokenConfig = {
                price: parseEther('0.01'),
                erc20Prices: [],
                ttl: 24n * 60n * 60n, // 1 day
                transferable: true,
            };

            const hash1155 = await contract1155.write.createToken([config]);
            const receipt1155 = await publicClient.waitForTransactionReceipt({ hash: hash1155 });
            tokenId1155 = getTokenIdFromCreation(receipt1155);

            const hash6909 = await contract6909.write.createToken([config]);
            const receipt6909 = await publicClient.waitForTransactionReceipt({ hash: hash6909 });
            tokenId6909 = getTokenIdFromCreation(receipt6909);
        });

        it('should work with both contract types for purchaseWithNative', async () => {
            // Test with EVMAuth1155
            const hash1155 = await purchaseWithNative(contract1155, tokenId1155, 2n);
            const receipt1155 = await publicClient.waitForTransactionReceipt({ hash: hash1155 });
            expect(receipt1155.status).toBe('success');

            // Test with EVMAuth6909
            const hash6909 = await purchaseWithNative(contract6909, tokenId6909, 2n);
            const receipt6909 = await publicClient.waitForTransactionReceipt({ hash: hash6909 });
            expect(receipt6909.status).toBe('success');
        });

        it('should work with both contract types for hasActiveBalance', async () => {
            // Both should have balance after purchases
            const has1155 = await hasActiveBalance(contract1155, account, tokenId1155, 1n);
            expect(has1155).toBe(true);

            const has6909 = await hasActiveBalance(contract6909, account, tokenId6909, 1n);
            expect(has6909).toBe(true);
        });
    });
});
