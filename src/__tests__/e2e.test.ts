import { parseEther } from 'viem';
import { beforeEach, describe, expect, it } from 'vitest';
import { roles, tokenStandardInterfaceIds } from '../constants.js';
import type { EVMAuthToken, PaymentToken } from '../types.js';
import { vm } from './helpers/anvil.js';
import { TestHarness } from './helpers/harness.js';

/**
 * End-to-end tests for EVMAuth contracts, using Anvil as the local Ethereum node.
 *
 * These tests deploy the contracts, initialize them, and perform various actions
 * to verify that the Clients behave as expected in a real Ethereum environment.
 */
describe.each(['EVMAuth1155', 'EVMAuth6909'] as const)('%s', (contractType) => {
    const t: TestHarness = new TestHarness(contractType);

    beforeEach(async () => {
        await t.init();
    });

    describe.sequential('EVMAuthAccessManagerClient', () => {
        it('should freeze and unfreeze an account', async () => {
            // Create an account to be frozen
            const alice = vm.makeAddr();

            // Initially, the account should not be frozen
            const isFrozenBefore = await t.accessManagerClient.isFrozen(alice.address);
            expect(isFrozenBefore, 'isFrozenBefore').toBe(false);

            // Freeze the account
            const freezeTx = await t.accessManagerClient.freezeAccount(alice.address);
            expect(freezeTx, 'freezeTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Now the account should be frozen
            const isFrozenAfter = await t.accessManagerClient.isFrozen(alice.address);
            expect(isFrozenAfter, 'isFrozenAfter').toBe(true);

            // Unfreeze the account
            const unfreezeTx = await t.accessManagerClient.unfreezeAccount(alice.address);
            expect(unfreezeTx, 'unfreezeTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Finally, the account should not be frozen anymore
            const isFrozenFinal = await t.accessManagerClient.isFrozen(alice.address);
            expect(isFrozenFinal, 'isFrozenFinal').toBe(false);
        });

        it('should get list of frozen accounts', async () => {
            // Create multiple accounts to be frozen
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Freeze both accounts
            await t.accessManagerClient.freezeAccount(alice.address);
            await t.accessManagerClient.freezeAccount(bob.address);

            // Retrieve the list of frozen accounts
            const frozenAccounts = await t.accessManagerClient.frozenAccounts();
            expect(frozenAccounts, 'frozenAccounts').toContain(alice.address);
            expect(frozenAccounts, 'frozenAccounts').toContain(bob.address);
        });

        it('should pause and unpause the contract', async () => {
            // Initially, the contract should not be paused
            const isPausedBefore = await t.accessManagerClient.paused();
            expect(isPausedBefore, 'isPausedBefore').toBe(false);

            // Pause the contract
            const pauseTx = await t.accessManagerClient.pause();
            expect(pauseTx, 'pauseTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Now the contract should be paused
            const isPausedAfter = await t.accessManagerClient.paused();
            expect(isPausedAfter, 'isPausedAfter').toBe(true);

            // Unpause the contract
            const unpauseTx = await t.accessManagerClient.unpause();
            expect(unpauseTx, 'unpauseTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Finally, the contract should not be paused anymore
            const isPausedFinal = await t.accessManagerClient.paused();
            expect(isPausedFinal, 'isPausedFinal').toBe(false);
        });

        it('should get freeze status constants', async () => {
            // Verify that the constants are valid 32-byte hex strings and are distinct
            const frozenStatus = await t.accessManagerClient.ACCOUNT_FROZEN_STATUS();
            const unfrozenStatus = await t.accessManagerClient.ACCOUNT_UNFROZEN_STATUS();
            expect(frozenStatus, 'frozenStatus').toMatch(/^0x[a-fA-F0-9]{64}$/);
            expect(unfrozenStatus, 'unfrozenStatus').toMatch(/^0x[a-fA-F0-9]{64}$/);
            expect(frozenStatus, 'frozenStatus').not.toBe(unfrozenStatus);
        });

        it('should fail when unauthorized account tries to freeze', async () => {
            // Create an account that is not the access manager, and another to be frozen
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Create an EVMAuth client connected to Alice's wallet (unauthorized)
            const unauthorizedSDK = t.createAccessManagerClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, '10');

            // Attempt to freeze Bob's account using the unauthorized client
            await expect(unauthorizedSDK.freezeAccount(bob.address)).rejects.toThrow();
        });

        it('should fail when unauthorized account tries to pause', async () => {
            // Create an account that is not the access manager
            const alice = vm.makeAddr();

            // Create an EVMAuth client connected to Alice's wallet (unauthorized)
            const unauthorizedSDK = t.createAccessManagerClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, '10');

            // Attempt to pause the contract using the unauthorized client
            await expect(unauthorizedSDK.pause()).rejects.toThrow();
        });
    });

    describe.sequential('EVMAuthAdminClient', () => {
        it('should grant a role to an account', async () => {
            // Create an account to be granted a role
            const alice = vm.makeAddr();

            // Grant MINTER_ROLE to Alice
            const txHash = await t.adminClient.grantRole(roles.MINTER_ROLE, alice.address);
            expect(txHash, 'txHash').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify that Alice now has the MINTER_ROLE
            const hasRole = await t.adminClient.hasRole(roles.MINTER_ROLE, alice.address);
            expect(hasRole, 'hasRole').toBe(true);
        });

        it('should revoke a role from an account', async () => {
            // Create an account and grant it the MINTER_ROLE
            const alice = vm.makeAddr();

            // First, grant the role to Alice
            await t.adminClient.grantRole(roles.MINTER_ROLE, alice.address);

            // Now revoke the MINTER_ROLE from Alice
            const txHash = await t.adminClient.revokeRole(roles.MINTER_ROLE, alice.address);
            expect(txHash, 'txHash').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify that Alice no longer has the MINTER_ROLE
            const hasRole = await t.adminClient.hasRole(roles.MINTER_ROLE, alice.address);
            expect(hasRole, 'hasRole').toBe(false);
        });

        it('should check if account has role', async () => {
            // The owner should have the DEFAULT_ADMIN_ROLE
            const hasAdminRole = await t.adminClient.hasRole(
                roles.DEFAULT_ADMIN_ROLE,
                t.owner.address
            );
            expect(hasAdminRole, 'hasAdminRole').toBe(true);

            // The owner should not have the MINTER_ROLE initially
            const hasMinterRole = await t.adminClient.hasRole(roles.MINTER_ROLE, t.owner.address);
            expect(hasMinterRole, 'hasMinterRole').toBe(false);
        });

        it('should always return default admin', async () => {
            // The admin of all roles should be DEFAULT_ADMIN_ROLE
            for (const role of Object.values(roles)) {
                const adminRole = await t.adminClient.getRoleAdmin(role);
                expect(adminRole, 'adminRole').toBe(roles.DEFAULT_ADMIN_ROLE);
            }
        });

        it('should get default admin info', async () => {
            // The default admin should be the owner
            const defaultAdmin = await t.adminClient.defaultAdmin();
            expect(defaultAdmin, 'defaultAdmin').toBe(t.owner.address);

            const oldDelay = await t.adminClient.defaultAdminDelay();
            const newDelay = oldDelay + 100;
            await t.adminClient.changeDefaultAdminDelay(newDelay);

            const { delay: pendingDelay, schedule } =
                await t.adminClient.pendingDefaultAdminDelay();
            const expectedSchedule = Number((await vm.block()).timestamp) + newDelay;
            expect(pendingDelay, 'pendingDelay').toBe(newDelay);
            expect(schedule, 'schedule').toBe(expectedSchedule);

            // Wait for the delay to pass
            await vm.skip(expectedSchedule + 1);

            const defaultAdminDelay = await t.adminClient.defaultAdminDelay();
            expect(defaultAdminDelay, 'defaultAdminDelay').toBe(newDelay);
        });

        it('should begin default admin transfer', async () => {
            // Create a new admin account
            const alice = vm.makeAddr();

            // Begin the admin transfer to Alice
            const currentTime = Math.floor(Date.now() / 1000);
            const currentDelay = await t.adminClient.defaultAdminDelay();
            const txHash = await t.adminClient.beginDefaultAdminTransfer(alice.address);
            expect(txHash, 'txHash').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify that Alice is now the pending admin
            const { address: pendingAdmin, schedule } = await t.adminClient.pendingDefaultAdmin();
            expect(pendingAdmin, 'pendingAdmin').toBe(alice.address);
            expect(schedule, 'schedule').toBeGreaterThanOrEqual(currentTime + currentDelay);
        });

        it('should cancel pending admin transfer', async () => {
            // Create a new admin account
            const alice = vm.makeAddr();

            // Begin the admin transfer to Alice
            await t.adminClient.beginDefaultAdminTransfer(alice.address);

            // Now cancel the admin transfer
            const txHash = await t.adminClient.cancelDefaultAdminTransfer();
            expect(txHash, 'txHash').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify that there is no longer a pending admin
            const { address: pendingAdmin } = await t.adminClient.pendingDefaultAdmin();
            expect(pendingAdmin, 'pendingAdmin').toBe('0x0000000000000000000000000000000000000000');
        });

        it('should fail when non-admin tries to grant role', async () => {
            // Create an account that is not the admin
            const alice = vm.makeAddr();

            // Create an EVMAuth client connected to Alice's wallet (unauthorized)
            const unauthorizedSDK = t.createAdminClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, '10');

            // Attempt to grant MINTER_ROLE to Alice using the unauthorized client
            await expect(
                unauthorizedSDK.grantRole(roles.MINTER_ROLE, alice.address)
            ).rejects.toThrow();
        });
    });

    describe.sequential('EVMAuthBurnerClient', () => {
        it('should burn tokens from an address', async () => {
            // Create an account and EVMAuth client to check balances
            const alice = vm.makeAddr();
            const clientSDK = t.createPublicClient(alice);

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({
                to: alice.address,
                tokenId,
                amount: 10n,
            });

            // Verify Alice's balance before burning
            const balanceBefore = await clientSDK.balanceOf(alice.address, tokenId);
            expect(balanceBefore, 'balanceBefore').toBe(10n);

            // Burn some of Alice's tokens
            const burnTx = await t.burnerClient.burn({
                from: alice.address,
                tokenId,
                amount: 3n,
            });
            expect(burnTx, 'burnTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify Alice's balance after burning
            const balanceAfter = await clientSDK.balanceOf(alice.address, tokenId);
            expect(balanceAfter, 'balanceAfter').toBe(7n);
        });

        it('should batch burn multiple token types', async () => {
            // Create an account and EVMAuth client to check balances
            const alice = vm.makeAddr();
            const clientSDK = t.createPublicClient(alice);

            // Create two tokens
            const { tokenId: tokenId1 } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });
            const { tokenId: tokenId2 } = await t.tokenManagerClient.createToken({
                price: parseEther('2'),
                erc20Prices: [],
                ttl: 7200n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mintBatch({
                to: alice.address,
                tokenIds: [tokenId1, tokenId2],
                amounts: [10n, 8n],
            });

            // Verify Alice's balances before burning
            const balancesBefore = await clientSDK.balanceOfBatch(
                [alice.address, alice.address],
                [tokenId1, tokenId2]
            );
            expect(balancesBefore[0]).toBe(10n);
            expect(balancesBefore[1]).toBe(8n);

            // Burn some of Alice's tokens
            const hashes = await t.burnerClient.burnBatch({
                from: alice.address,
                tokenIds: [tokenId1, tokenId2],
                amounts: [3n, 2n],
            });
            for (const hash of hashes) {
                expect(hash, 'hash').toMatch(/^0x[a-fA-F0-9]{64}$/);
            }

            // Verify Alice's balances after burning
            const balancesAfter = await clientSDK.balanceOfBatch(
                [alice.address, alice.address],
                [tokenId1, tokenId2]
            );
            expect(balancesAfter[0]).toBe(7n);
            expect(balancesAfter[1]).toBe(6n);
        });

        it('should fail burning more than balance', async () => {
            // Create an account
            const alice = vm.makeAddr();

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({
                to: alice.address,
                tokenId,
                amount: 5n,
            });

            // Attempt to burn more tokens than Alice has
            await expect(
                t.burnerClient.burn({
                    from: alice.address,
                    tokenId,
                    amount: 10n,
                })
            ).rejects.toThrow();
        });

        it('should fail batch burn with mismatched arrays', async () => {
            // Create an account
            const alice = vm.makeAddr();

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({
                to: alice.address,
                tokenId,
                amount: 10n,
            });

            // Attempt to batch burn with mismatched tokenIds and amounts arrays
            await expect(
                t.burnerClient.burnBatch({
                    from: alice.address,
                    tokenIds: [tokenId],
                    amounts: [5n, 3n], // Mismatched length
                })
            ).rejects.toThrow('Token IDs and amounts arrays must have the same length');
        });

        it('should fail when non-burner tries to burn', async () => {
            // Create an account that is not the burner
            const alice = vm.makeAddr();

            // Create an SDK instance connected to Alice's wallet (unauthorized)
            const unauthorizedSDK = t.createBurnerClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, '10');

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({
                to: alice.address,
                tokenId,
                amount: 10n,
            });

            // Attempt to burn tokens using the unauthorized SDK
            await expect(
                unauthorizedSDK.burn({
                    from: alice.address,
                    tokenId,
                    amount: 5n,
                })
            ).rejects.toThrow();
        });
    });

    describe.sequential('EVMAuthMinterClient', () => {
        it('should mint tokens to an address', async () => {
            // Create an account for Alice
            const alice = vm.makeAddr();

            // Create a EVMAuth client to check balances
            const clientSDK = t.createPublicClient();

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            const mintTx = await t.minterClient.mint({
                to: alice.address,
                tokenId,
                amount: 10n,
            });
            expect(mintTx, 'mintTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify Alice's token balance
            const balance = await clientSDK.balanceOf(alice.address, tokenId);
            expect(balance, 'balance').toBe(10n);
        });

        it('should batch mint multiple token types', async () => {
            // Create accounts for Alice and Bob
            const alice = vm.makeAddr();

            // Create a EVMAuth client to check balances
            const clientSDK = t.createPublicClient();

            // Create two tokens
            const { tokenId: tokenId1 } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });
            const { tokenId: tokenId2 } = await t.tokenManagerClient.createToken({
                price: parseEther('2'),
                erc20Prices: [],
                ttl: 7200n,
                transferable: false,
            });

            // Batch mint tokens to Alice
            const hashes = await t.minterClient.mintBatch({
                to: alice.address,
                tokenIds: [tokenId1, tokenId2],
                amounts: [5n, 3n],
            });
            for (const hash of hashes) {
                expect(hash, 'hash').toMatch(/^0x[a-fA-F0-9]{64}$/);
            }

            // Verify Alice's token balances
            const balances = await clientSDK.balanceOfBatch(
                [alice.address, alice.address],
                [tokenId1, tokenId2]
            );
            expect(balances[0]).toBe(5n);
            expect(balances[1]).toBe(3n);
        });

        it('should test TTL-based balance expiration', async () => {
            // Create an account for Alice
            const alice = vm.makeAddr();

            // Create a EVMAuth client to check balances
            const clientSDK = t.createPublicClient();

            // Create a token with a TTL of 1 hour
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n, // 1 hour
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({
                to: alice.address,
                tokenId,
                amount: 10n,
            });

            // Verify Alice's balance before TTL expiration
            const balanceBefore = await clientSDK.balanceOf(alice.address, tokenId);
            expect(balanceBefore, 'balanceBefore').toBe(10n);

            // Advance time past TTL
            await vm.skip(3600 * 1.01 - 1); // Max expiration is TTL * 1.01 - 1 second

            // Verify Alice's balance after TTL expiration
            const balanceAfter = await clientSDK.balanceOf(alice.address, tokenId);
            expect(balanceAfter, 'balanceAfter').toBe(0n);
        });

        it('should get default max balance records', async () => {
            // Get the default max balance records
            const maxRecords = await t.minterClient.DEFAULT_MAX_BALANCE_RECORDS();
            expect(maxRecords, 'maxRecords').toBe(100n);
        });

        it('should fail batch mint with mismatched arrays', async () => {
            // Create an account for Alice
            const alice = vm.makeAddr();

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Attempt to batch mint with mismatched tokenIds and amounts arrays
            await expect(
                t.minterClient.mintBatch({
                    to: alice.address,
                    tokenIds: [tokenId],
                    amounts: [5n, 3n], // Mismatched length
                })
            ).rejects.toThrow('Token IDs and amounts arrays must have the same length');
        });

        it('should fail when non-minter tries to mint', async () => {
            // Create an unauthorized minter SDK for Alice
            const alice = vm.makeAddr();
            const unauthorizedSDK = t.createMinterClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, '10');

            // Create a token to attempt to mint
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Attempt to mint tokens (should fail)
            await expect(
                unauthorizedSDK.mint({
                    to: alice.address,
                    tokenId,
                    amount: 10n,
                })
            ).rejects.toThrow();
        });
    });

    describe.sequential('EVMAuthPublicClient', () => {
        it('should purchase tokens with native currency', async () => {
            // Create a EVMAuth client for Alice
            const alice = vm.makeAddr();
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account with 10 ETH
            await vm.deal(alice.address, '10');

            // Create a token with a price of 0.5 ETH
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('0.5'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Purchase 3 tokens (should cost 1.5 ETH)
            const purchaseTx = await clientSDK.purchase(tokenId, 3n);
            expect(purchaseTx, 'purchaseTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify Alice's token balance
            const tokenBalance = await clientSDK.balanceOf(alice.address, tokenId);
            expect(tokenBalance, 'tokenBalance').toBe(3n);

            // Get the gas cost of the transaction
            const gasCost = await t.getTxGasCost(purchaseTx);

            // Verify Alice's ETH balance decreased by 1.5 ETH + gas fees
            const ethBalance = await vm.publicClient.getBalance({ address: alice.address });
            expect(ethBalance, 'ethBalance').toBe(parseEther('10') - parseEther('1.5') - gasCost);
        });

        it('should purchase tokens for another address', async () => {
            // Create a EVMAuth client for Alice
            const alice = vm.makeAddr();
            const clientSDK = t.createPublicClient(alice);

            // Create another account to receive the tokens
            const bob = vm.makeAddr();

            // Fund Alice's account with 10 ETH
            await vm.deal(alice.address, parseEther('10'));

            // Create a token with a price of 1 ETH
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Purchase 2 tokens for Bob
            const purchaseTx = await clientSDK.purchaseFor(bob.address, tokenId, 2n);
            expect(purchaseTx, 'purchaseTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify Bob's token balance
            const bobBalance = await clientSDK.balanceOf(bob.address, tokenId);
            expect(bobBalance, 'bobBalance').toBe(2n);

            // Verify Alice's token balance is still zero
            const aliceBalance = await clientSDK.balanceOf(alice.address, tokenId);
            expect(aliceBalance, 'aliceBalance').toBe(0n);

            // Get the gas cost of the transaction
            const gasCost = await t.getTxGasCost(purchaseTx);

            // Verify Alice's ETH balance decreased by 2 ETH + gas fees
            const ethBalance = await vm.publicClient.getBalance({ address: alice.address });
            expect(ethBalance, 'ethBalance').toBe(parseEther('10') - parseEther('2') - gasCost);
        });

        it('should get token balance and batch balances', async () => {
            // Create accounts for Alice and Bob
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Create a EVMAuth client
            const clientSDK = t.createPublicClient();

            // Create two tokens
            const { tokenId: tokenId1 } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });
            const { tokenId: tokenId2 } = await t.tokenManagerClient.createToken({
                price: parseEther('2'),
                erc20Prices: [],
                ttl: 7200n,
                transferable: true,
            });

            // Mint some tokens to Alice and Bob
            await t.minterClient.mint({ to: alice.address, tokenId: tokenId1, amount: 5n });
            await t.minterClient.mint({ to: bob.address, tokenId: tokenId2, amount: 3n });

            // Verify individual balances
            const aliceToken1Balance = await clientSDK.balanceOf(alice.address, tokenId1);
            const aliceToken2Balance = await clientSDK.balanceOf(alice.address, tokenId2);
            const bobToken1Balance = await clientSDK.balanceOf(bob.address, tokenId1);
            const bobToken2Balance = await clientSDK.balanceOf(bob.address, tokenId2);
            expect(aliceToken1Balance, 'aliceToken1Balance').toBe(5n);
            expect(aliceToken2Balance, 'aliceToken2Balance').toBe(0n);
            expect(bobToken1Balance, 'bobToken1Balance').toBe(0n);
            expect(bobToken2Balance, 'bobToken2Balance').toBe(3n);

            // Verify batch balances
            const batchBalances = await clientSDK.balanceOfBatch(
                [alice.address, alice.address, bob.address, bob.address],
                [tokenId1, tokenId2, tokenId1, tokenId2]
            );
            expect(batchBalances[0]).toBe(5n);
            expect(batchBalances[1]).toBe(0n);
            expect(batchBalances[2]).toBe(0n);
            expect(batchBalances[3]).toBe(3n);
        });

        it('should get balance records with expiration', async () => {
            // Create an account for Alice
            const alice = vm.makeAddr();

            // Create a EVMAuth client to check balances
            const clientSDK = t.createPublicClient();

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({ to: alice.address, tokenId, amount: 5n });

            // Retrieve balance records for Alice
            const records = await clientSDK.balanceRecordsOf(alice.address, tokenId);
            expect(records.length).toBe(1);
            expect(records[0].amount).toBe(5n);
            expect(records[0].expiresAt).toBeGreaterThan(0n);
        });

        it('should check active balance', async () => {
            // Create an account for Alice
            const alice = vm.makeAddr();

            // Create a EVMAuth client to check balances
            const clientSDK = t.createPublicClient();

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({ to: alice.address, tokenId, amount: 10n });

            // Check various active balance scenarios
            const hasBalance = await clientSDK.hasRequiredBalance(alice.address, tokenId, 5n);
            expect(hasBalance, 'hasBalance').toBe(true);

            // Check for exact balance
            const hasExactBalance = await clientSDK.hasRequiredBalance(alice.address, tokenId, 10n);
            expect(hasExactBalance, 'hasExactBalance').toBe(true);

            // Check for more than balance
            const hasMoreThanBalance = await clientSDK.hasRequiredBalance(
                alice.address,
                tokenId,
                15n
            );
            expect(hasMoreThanBalance, 'hasMoreThanBalance').toBe(false);
        });

        it('should transfer tokens when transferable', async () => {
            // Create accounts for Alice and Bob
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Create a EVMAuth client for Alice
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, parseEther('10'));

            // Create a token that is transferable
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({ to: alice.address, tokenId, amount: 10n });

            // Transfer some tokens from Alice to Bob
            const transferTx = await clientSDK.transferFrom({
                from: alice.address,
                to: bob.address,
                tokenId,
                amount: 3n,
            });
            expect(transferTx, 'transferTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify final balances
            const aliceBalance = await clientSDK.balanceOf(alice.address, tokenId);
            const bobBalance = await clientSDK.balanceOf(bob.address, tokenId);
            expect(aliceBalance, 'aliceBalance').toBe(7n);
            expect(bobBalance, 'bobBalance').toBe(3n);
        });

        it('should fail transfer when non-transferable', async () => {
            // Create accounts for Alice and Bob
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Create a EVMAuth client for Alice
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, parseEther('10'));

            // Create a token that is non-transferable
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: false,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({ to: alice.address, tokenId, amount: 10n });

            // Attempt to transfer tokens from Alice to Bob (should fail)
            await expect(
                clientSDK.transferFrom({
                    from: alice.address,
                    to: bob.address,
                    tokenId,
                    amount: 3n,
                })
            ).rejects.toThrow();
        });

        it('should batch transfer multiple tokens', async () => {
            // Create accounts for Alice and Bob
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Create a EVMAuth client for Alice
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, parseEther('10'));

            // Create two tokens
            const { tokenId: tokenId1 } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });
            const { tokenId: tokenId2 } = await t.tokenManagerClient.createToken({
                price: parseEther('2'),
                erc20Prices: [],
                ttl: 7200n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mintBatch({
                to: alice.address,
                tokenIds: [tokenId1, tokenId2],
                amounts: [10n, 8n],
            });

            // Batch transfer tokens from Alice to Bob
            const hashes = await clientSDK.batchTransferFrom({
                from: alice.address,
                to: bob.address,
                tokenIds: [tokenId1, tokenId2],
                amounts: [3n, 2n],
            });
            // loop through transaction hashes and verify they are valid
            for (const hash of hashes) {
                expect(hash, 'txHash').toMatch(/^0x[a-fA-F0-9]{64}$/);
            }

            // Verify final balances for Alice
            const aliceBalances = await clientSDK.balanceOfBatch(
                [alice.address, alice.address],
                [tokenId1, tokenId2]
            );
            expect(aliceBalances[0]).toBe(7n);
            expect(aliceBalances[1]).toBe(6n);

            // Verify final balances for Bob
            const bobBalances = await clientSDK.balanceOfBatch(
                [bob.address, bob.address],
                [tokenId1, tokenId2]
            );
            expect(bobBalances[0]).toBe(3n);
            expect(bobBalances[1]).toBe(2n);
        });

        it('should set and check operator approval', async () => {
            // Create accounts for Alice and Bob
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Create a EVMAuth client for Alice
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, parseEther('10'));

            // Initially, Bob should not be approved as an operator for Alice
            const isApprovedBefore = await clientSDK.isApprovedForAll(alice.address, bob.address);
            expect(isApprovedBefore, 'isApprovedBefore').toBe(false);

            // Approve Bob as an operator for Alice
            const approveTx = await clientSDK.setApprovalForAll(bob.address, true);
            expect(approveTx, 'approveTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Now, Bob should be approved as an operator for Alice
            const isApprovedAfter = await clientSDK.isApprovedForAll(alice.address, bob.address);
            expect(isApprovedAfter, 'isApprovedAfter').toBe(true);

            // Revoke Bob's operator approval
            const revokeTx = await clientSDK.setApprovalForAll(bob.address, false);
            expect(revokeTx, 'revokeTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Finally, Bob should no longer be approved as an operator for Alice
            const isApprovedFinal = await clientSDK.isApprovedForAll(alice.address, bob.address);
            expect(isApprovedFinal, 'isApprovedFinal').toBe(false);
        });

        it('should verify frozen account cannot transfer', async () => {
            // Create accounts for Alice and Bob
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Create a EVMAuth client for Alice
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, parseEther('10'));

            // Create a token that is transferable
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({ to: alice.address, tokenId, amount: 10n });

            // Freeze Alice's account
            await t.accessManagerClient.freezeAccount(alice.address);

            // Try to transfer (should fail)
            await expect(
                clientSDK.transferFrom({
                    from: alice.address,
                    to: bob.address,
                    tokenId,
                    amount: 3n,
                })
            ).rejects.toThrow();

            // Mint some tokens to Bob
            await t.minterClient.mint({ to: bob.address, tokenId, amount: 5n });

            // Try to transfer from Bob to Alice - should also fail
            await expect(
                clientSDK.transferFrom({
                    from: bob.address,
                    to: alice.address,
                    tokenId,
                    amount: 2n,
                })
            ).rejects.toThrow();
        });

        it('should block operations when contract is paused', async () => {
            // Create accounts for Alice and Bob
            const alice = vm.makeAddr();
            const bob = vm.makeAddr();

            // Create a EVMAuth client for Alice
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, parseEther('10'));

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({ to: alice.address, tokenId, amount: 5n });

            // Pause the contract
            await t.accessManagerClient.pause();

            // Try to purchase (should fail)
            await expect(clientSDK.purchase(tokenId, 2n)).rejects.toThrow();

            // Try to transfer (should fail)
            await expect(
                clientSDK.transferFrom({
                    from: alice.address,
                    to: bob.address,
                    tokenId,
                    amount: 1n,
                })
            ).rejects.toThrow();

            // Unpause the contract
            await t.accessManagerClient.unpause();

            // Now operations should succeed
            const purchaseTx = await clientSDK.purchase(tokenId, 2n);
            expect(purchaseTx, 'purchaseTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            const transferTx = await clientSDK.transferFrom({
                from: alice.address,
                to: bob.address,
                tokenId,
                amount: 1n,
            });
            expect(transferTx, 'transferTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify final balances
            const aliceBalance = await clientSDK.balanceOf(alice.address, tokenId);
            const bobBalance = await clientSDK.balanceOf(bob.address, tokenId);
            expect(aliceBalance, 'aliceBalance').toBe(6n); // 5 minted + 2 purchased - 1 transferred
            expect(bobBalance, 'bobBalance').toBe(1n); // 1 received
        });

        it('should test TTL expiration in balance', async () => {
            // Create a EVMAuth client for Alice
            const alice = vm.makeAddr();
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, parseEther('10'));

            // Create a token with a short TTL (30 minutes)
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 1800n, // 30 minutes
                transferable: true,
            });

            // Mint some tokens to Alice
            await t.minterClient.mint({ to: alice.address, tokenId, amount: 10n });

            // Verify Alice's balance before TTL expiration
            const balanceBefore = await clientSDK.balanceOf(alice.address, tokenId);
            expect(balanceBefore, 'balanceBefore').toBe(10n);

            // Advance time past TTL
            await vm.skip(1800 * 1.01 - 1); // Max expiration is TTL * 1.01 - 1 second

            // Verify Alice's balance after TTL expiration
            const balanceAfter = await clientSDK.balanceOf(alice.address, tokenId);
            expect(balanceAfter, 'balanceAfter').toBe(0n);
        });

        it('should query token metadata and info', async () => {
            // Create a EVMAuth client
            const clientSDK = t.createPublicClient();

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1.5'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Set token URI
            await t.tokenManagerClient.setTokenURI(tokenId, 'ipfs://metadata');

            // Check that the token exists
            const exists = await clientSDK.exists(tokenId);
            expect(exists, 'exists').toBe(true);

            // Check next token ID
            const nextId = await clientSDK.nextTokenID();
            expect(nextId, 'nextId').toBeGreaterThan(tokenId);

            // Get token price
            const price = await clientSDK.tokenPrice(tokenId);
            expect(price, 'price').toBe(parseEther('1.5'));

            // Get token TTL
            const uri = await clientSDK.uri(tokenId);
            expect(uri, 'uri').toContain('metadata');
        });

        it('should check interface support', async () => {
            // Create a EVMAuth client
            const clientSDK = t.createPublicClient();

            // Check support for the appropriate token standard interface (ERC-1155 or ERC-6909)
            const interfaceId = tokenStandardInterfaceIds[contractType];
            const supportsTokenStandardInterface = await clientSDK.supportsInterface(interfaceId);
            expect(supportsTokenStandardInterface, 'supportsTokenStandardInterface').toBe(true);
        });

        it('should get contract owner', async () => {
            // Create a EVMAuth client
            const clientSDK = t.createPublicClient();

            // Get the contract owner
            const contractOwner = await clientSDK.owner();
            expect(contractOwner, 'contractOwner').toBe(t.owner.address);
        });

        it('should fail purchase with insufficient funds', async () => {
            // Create a EVMAuth client for Alice
            const alice = vm.makeAddr();
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account with only 0.5 ETH
            await vm.deal(alice.address, parseEther('0.5'));

            // Create a token with a price of 1 ETH
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Attempt to purchase 1 token (should fail due to insufficient funds)
            await expect(clientSDK.purchase(tokenId, 1n)).rejects.toThrow();
        });
    });

    describe.sequential('EVMAuthTokenManagerClient', () => {
        it('should create a token and return token ID', async () => {
            // Create a token
            const { hash, tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });
            expect(hash, 'hash').toMatch(/^0x[a-fA-F0-9]{64}$/);
            expect(tokenId, 'tokenId').toBe(1n);

            // Verify the token exists
            const exists = await t.tokenManagerClient.exists(tokenId);
            expect(exists, 'exists').toBe(true);
        });

        it('should create non-transferable token with price and TTL', async () => {
            // Create a non-transferable token with a TTL of 24 hours
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('0.5'),
                erc20Prices: [],
                ttl: 86400n, // 24 hours
                transferable: false,
            });

            // Verify token properties
            const price = await t.tokenManagerClient.tokenPrice(tokenId);
            const ttl = await t.tokenManagerClient.tokenTTL(tokenId);
            const isTransferable = await t.tokenManagerClient.isTransferable(tokenId);
            expect(price, 'price').toBe(parseEther('0.5'));
            expect(ttl, 'ttl').toBe(86400n);
            expect(isTransferable, 'isTransferable').toBe(false);
        });

        it('should update token configuration', async () => {
            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n, // 1 hour
                transferable: true,
            });

            // Update the token's price, TTL, and transferability
            const updateTx = await t.tokenManagerClient.updateToken(tokenId, {
                price: parseEther('2'),
                erc20Prices: [],
                ttl: 7200n,
                transferable: false,
            });
            expect(updateTx, 'updateTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Verify the updated properties
            const newPrice = await t.tokenManagerClient.tokenPrice(tokenId);
            const newTTL = await t.tokenManagerClient.tokenTTL(tokenId);
            const isTransferable = await t.tokenManagerClient.isTransferable(tokenId);
            expect(newPrice, 'newPrice').toBe(parseEther('2'));
            expect(newTTL, 'newTTL').toBe(7200n);
            expect(isTransferable, 'isTransferable').toBe(false);
        });

        it('should set token and base URI', async () => {
            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Set token URI
            const setUriTx = await t.tokenManagerClient.setTokenURI(
                tokenId,
                'ipfs://token-metadata'
            );
            expect(setUriTx, 'setUriTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Get token URI
            const uri = await t.tokenManagerClient.uri(tokenId);
            expect(uri, 'uri').toContain('token-metadata');

            // Set base URI
            const setBaseUriTx = await t.tokenManagerClient.setBaseURI(
                'https://metadata.example.com/'
            );
            expect(setBaseUriTx, 'setBaseUriTx').toMatch(/^0x[a-fA-F0-9]{64}$/);
        });

        it('should get token configuration', async () => {
            // Create a token with specific configuration
            const price = parseEther('1.5');
            const erc20Prices: PaymentToken[] = [];
            const ttl = 7200n;
            const transferable = true;
            const { tokenId } = await t.tokenManagerClient.createToken({
                price,
                erc20Prices,
                ttl,
                transferable,
            });

            // Retrieve and verify the token configuration
            const { config }: EVMAuthToken = await t.tokenManagerClient.tokenConfig(tokenId);
            expect(config.price).toBe(price);
            expect(config.ttl).toBe(ttl);
            expect(config.transferable).toBe(transferable);
        });

        it('should get next token ID', async () => {
            // Initially, next token ID should be 1
            const nextIdBefore = await t.tokenManagerClient.nextTokenID();
            expect(nextIdBefore, 'nextIdBefore').toBe(1n);

            // Create a token
            await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Now, next token ID should be incremented
            const nextIdAfter = await t.tokenManagerClient.nextTokenID();
            expect(nextIdAfter, 'nextIdAfter').toBe(nextIdBefore + 1n);
        });

        it('should fail when non-token-manager tries to create token', async () => {
            // Create an unauthorized token manager SDK for Alice
            const alice = vm.makeAddr();
            const unauthorizedSDK = t.createTokenManagerClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, '10');

            // Attempt to create a token (should fail)
            await expect(
                unauthorizedSDK.createToken({
                    price: parseEther('1'),
                    erc20Prices: [],
                    ttl: 3600n,
                    transferable: true,
                })
            ).rejects.toThrow();
        });
    });

    describe.sequential('EVMAuthTreasurerClient', () => {
        it('should set and get treasury address', async () => {
            const currentTreasury = await t.treasurerClient.treasury();
            expect(currentTreasury, 'currentTreasury').toBe(t.treasuryAddress);

            const newTreasury = vm.makeAddr();
            const setTx = await t.treasurerClient.setTreasury(newTreasury.address);
            expect(setTx, 'setTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            const updatedTreasury = await t.treasurerClient.treasury();
            expect(updatedTreasury, 'updatedTreasury').toBe(newTreasury.address);
        });

        it('should send funds from purchases to treasury', async () => {
            // Create a EVMAuth client for Alice
            const alice = vm.makeAddr();
            const clientSDK = t.createPublicClient(alice);

            // Fund Alice's account
            await vm.deal(alice.address, parseEther('10'));

            // Create a token
            const { tokenId } = await t.tokenManagerClient.createToken({
                price: parseEther('1'),
                erc20Prices: [],
                ttl: 3600n,
                transferable: true,
            });

            // Check treasury balance before purchase
            const treasuryBalanceBefore = await vm.publicClient.getBalance({
                address: t.treasuryAddress,
            });

            // Purchase some tokens
            const purchaseTx = await clientSDK.purchase(tokenId, 2n);
            expect(purchaseTx, 'purchaseTx').toMatch(/^0x[a-fA-F0-9]{64}$/);

            // Check treasury balance after purchase
            const treasuryBalanceAfter = await vm.publicClient.getBalance({
                address: t.treasuryAddress,
            });

            // Expect treasury balance to have increased by the purchase amount
            const expectedIncrease = parseEther('2'); // 2 tokens at 1 ETH each
            expect(treasuryBalanceAfter - treasuryBalanceBefore).toBe(expectedIncrease);
        });

        it('should fail when non-treasurer tries to set treasury', async () => {
            // Create an unauthorized EVMAuth client for Alice
            const alice = vm.makeAddr();
            const unauthorizedSDK = t.createTreasurerClient(alice);

            // Fund Alice's account for gas
            await vm.deal(alice.address, '10');

            // Attempt to set the treasury address (should fail)
            await expect(unauthorizedSDK.setTreasury(alice.address)).rejects.toThrow();
        });
    });
});
