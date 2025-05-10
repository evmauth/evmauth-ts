import type { JsonRpcProvider } from 'ethers';
import { Contract } from 'ethers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Signer } from '../src';
import { EVMAuth } from '../src';

// Mock the ethers Contract class and other dependencies
vi.mock('ethers', async () => {
    const actual = await vi.importActual('ethers');
    return {
        ...(actual as object),
        Contract: vi.fn().mockImplementation((address, _abi, _providerOrSigner) => ({
            target: address,
            DEFAULT_ADMIN_ROLE: vi.fn().mockResolvedValue('0x00'),
            TOKEN_MANAGER_ROLE: vi.fn().mockResolvedValue('0x01'),
            TOKEN_MINTER_ROLE: vi.fn().mockResolvedValue('0x02'),
            TOKEN_BURNER_ROLE: vi.fn().mockResolvedValue('0x03'),
            BLACKLIST_MANAGER_ROLE: vi.fn().mockResolvedValue('0x04'),
            FINANCE_MANAGER_ROLE: vi.fn().mockResolvedValue('0x05'),
            PROJECT_ID: vi.fn().mockResolvedValue('0x06'),
            hasRole: vi.fn().mockResolvedValue(true),
            grantRole: vi.fn().mockResolvedValue({ hash: '0x123' }),
            grantRoles: vi.fn().mockResolvedValue({ hash: '0x456' }),
            revokeRole: vi.fn().mockResolvedValue({ hash: '0x789' }),
            revokeRoles: vi.fn().mockResolvedValue({ hash: '0xabc' }),
            renounceRole: vi.fn().mockResolvedValue({ hash: '0xdef' }),
            getRoleAdmin: vi.fn().mockResolvedValue('0x00'),
            metadataOf: vi.fn().mockResolvedValue({
                id: BigInt(0),
                active: true,
                burnable: true,
                transferable: true,
                price: BigInt(100),
                ttl: BigInt(3600),
            }),
            metadataOfAll: vi.fn().mockResolvedValue([
                {
                    id: BigInt(0),
                    active: true,
                    burnable: true,
                    transferable: true,
                    price: BigInt(100),
                    ttl: BigInt(3600),
                },
            ]),
            metadataOfBatch: vi.fn().mockResolvedValue([
                {
                    id: BigInt(0),
                    active: true,
                    burnable: true,
                    transferable: true,
                    price: BigInt(100),
                    ttl: BigInt(3600),
                },
            ]),
            baseMetadataOf: vi.fn().mockResolvedValue({
                id: BigInt(0),
                active: true,
                burnable: true,
                transferable: true,
            }),
            baseMetadataOfAll: vi.fn().mockResolvedValue([
                {
                    id: BigInt(0),
                    active: true,
                    burnable: true,
                    transferable: true,
                },
            ]),
            baseMetadataOfBatch: vi.fn().mockResolvedValue([
                {
                    id: BigInt(0),
                    active: true,
                    burnable: true,
                    transferable: true,
                },
            ]),
            setMetadata: vi.fn().mockResolvedValue({ hash: '0xa1b2' }),
            setBaseMetadata: vi.fn().mockResolvedValue({ hash: '0xc3d4' }),
            active: vi.fn().mockResolvedValue(true),
            burnable: vi.fn().mockResolvedValue(true),
            transferable: vi.fn().mockResolvedValue(true),
            forSale: vi.fn().mockResolvedValue(true),
            priceOf: vi.fn().mockResolvedValue(BigInt(100)),
            priceOfAll: vi.fn().mockResolvedValue([BigInt(100)]),
            priceOfBatch: vi.fn().mockResolvedValue([BigInt(100)]),
            setPriceOf: vi.fn().mockResolvedValue({ hash: '0xe5f6' }),
            setPriceOfBatch: vi.fn().mockResolvedValue({ hash: '0xg7h8' }),
            ttlOf: vi.fn().mockResolvedValue(BigInt(3600)),
            ttlOfAll: vi.fn().mockResolvedValue([BigInt(3600)]),
            ttlOfBatch: vi.fn().mockResolvedValue([BigInt(3600)]),
            setTTL: vi.fn().mockResolvedValue({ hash: '0xi9j0' }),
            expirationFor: vi.fn().mockResolvedValue(BigInt(Date.now() + 3600000)),
            balanceOf: vi.fn().mockResolvedValue(BigInt(10)),
            balanceOfAll: vi.fn().mockResolvedValue([BigInt(10)]),
            balanceOfBatch: vi.fn().mockResolvedValue([BigInt(10)]),
            balanceDetailsOf: vi.fn().mockResolvedValue([
                {
                    balance: BigInt(10),
                    expiresAt: BigInt(Date.now() + 3600000),
                },
            ]),
            balanceDetailsOfAll: vi.fn().mockResolvedValue([
                [
                    {
                        balance: BigInt(10),
                        expiresAt: BigInt(Date.now() + 3600000),
                    },
                ],
            ]),
            balanceDetailsOfBatch: vi.fn().mockResolvedValue([
                [
                    {
                        balance: BigInt(10),
                        expiresAt: BigInt(Date.now() + 3600000),
                    },
                ],
            ]),
            setApprovalForAll: vi.fn().mockResolvedValue({ hash: '0xk1l2' }),
            isApprovedForAll: vi.fn().mockResolvedValue(true),
            safeTransferFrom: vi.fn().mockResolvedValue({ hash: '0xm3n4' }),
            safeBatchTransferFrom: vi.fn().mockResolvedValue({ hash: '0xo5p6' }),
            issue: vi.fn().mockResolvedValue({ hash: '0xq7r8' }),
            issueBatch: vi.fn().mockResolvedValue({ hash: '0xs9t0' }),
            burn: vi.fn().mockResolvedValue({ hash: '0xu1v2' }),
            burnBatch: vi.fn().mockResolvedValue({ hash: '0xw3x4' }),
            purchase: vi.fn().mockResolvedValue({ hash: '0xy5z6' }),
            isBlacklisted: vi.fn().mockResolvedValue(false),
            addToBlacklist: vi.fn().mockResolvedValue({ hash: '0xa7b8' }),
            addBatchToBlacklist: vi.fn().mockResolvedValue({ hash: '0xc9d0' }),
            removeFromBlacklist: vi.fn().mockResolvedValue({ hash: '0xe1f2' }),
            removeBatchFromBlacklist: vi.fn().mockResolvedValue({ hash: '0xg3h4' }),
            owner: vi.fn().mockResolvedValue('0x123456'),
            defaultAdmin: vi.fn().mockResolvedValue('0x123456'),
            pendingDefaultAdmin: vi.fn().mockResolvedValue(['0x654321', 123456]),
            beginDefaultAdminTransfer: vi.fn().mockResolvedValue({ hash: '0xi5j6' }),
            acceptDefaultAdminTransfer: vi.fn().mockResolvedValue({ hash: '0xk7l8' }),
            cancelDefaultAdminTransfer: vi.fn().mockResolvedValue({ hash: '0xm9n0' }),
            defaultAdminDelay: vi.fn().mockResolvedValue(86400),
            pendingDefaultAdminDelay: vi.fn().mockResolvedValue([172800, 123456]),
            changeDefaultAdminDelay: vi.fn().mockResolvedValue({ hash: '0xo1p2' }),
            rollbackDefaultAdminDelay: vi.fn().mockResolvedValue({ hash: '0xq3r4' }),
            wallet: vi.fn().mockResolvedValue('0xabcdef'),
            setWallet: vi.fn().mockResolvedValue({ hash: '0xs5t6' }),
            uri: vi.fn().mockResolvedValue('https://example.com/token/{id}'),
            setURI: vi.fn().mockResolvedValue({ hash: '0xu7v8' }),
            withdraw: vi.fn().mockResolvedValue({ hash: '0xw9x0' }),
            // Event filter mocks
            filters: {
                TransferSingle: vi.fn().mockReturnValue('transferSingleFilter'),
                TransferBatch: vi.fn().mockReturnValue('transferBatchFilter'),
                ApprovalForAll: vi.fn().mockReturnValue('approvalForAllFilter'),
                TokenMetadataUpdated: vi.fn().mockReturnValue('tokenMetadataUpdatedFilter'),
                TokenPurchased: vi.fn().mockReturnValue('tokenPurchasedFilter'),
                AddedToBlacklist: vi.fn().mockReturnValue('addedToBlacklistFilter'),
                RemovedFromBlacklist: vi.fn().mockReturnValue('removedFromBlacklistFilter'),
                ExpiredTokensBurned: vi.fn().mockReturnValue('expiredTokensBurnedFilter'),
                FundsWithdrawn: vi.fn().mockReturnValue('fundsWithdrawnFilter'),
                RoleGranted: vi.fn().mockReturnValue('roleGrantedFilter'),
                RoleRevoked: vi.fn().mockReturnValue('roleRevokedFilter'),
            },
            on: vi.fn().mockImplementation(() => {}),
            off: vi.fn().mockImplementation(() => {}),
        })),
    };
});

describe('EVMAuth', () => {
    let evmAuth: EVMAuth;
    let mockContractAddress: string;
    let mockProvider: JsonRpcProvider;
    let mockSigner: Signer;

    beforeEach(() => {
        mockContractAddress = '0x1234567890123456789012345678901234567890';

        // Mock provider
        mockProvider = {
            // Minimal implementation required for tests
        } as unknown as JsonRpcProvider;

        // Mock signer
        mockSigner = {
            signMessage: vi.fn().mockResolvedValue('0xsignature'),
            provider: mockProvider,
        };

        // Create instance with provider for read-only operations
        evmAuth = new EVMAuth(mockContractAddress, mockProvider);
    });

    // Test constructor
    describe('constructor', () => {
        it('should create instance with provider', () => {
            expect(evmAuth).toBeInstanceOf(EVMAuth);
            expect(Contract).toHaveBeenCalledWith(
                mockContractAddress,
                expect.any(Array),
                mockProvider
            );
        });

        it('should create instance with signer', () => {
            const evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
            expect(evmAuthWithSigner).toBeInstanceOf(EVMAuth);
            expect(Contract).toHaveBeenCalledWith(
                mockContractAddress,
                expect.any(Array),
                mockSigner
            );
        });
    });

    // Test connect method
    describe('connect', () => {
        it('should return a new instance with the signer connected', () => {
            const connectedEvmAuth = evmAuth.connect(mockSigner);
            expect(connectedEvmAuth).toBeInstanceOf(EVMAuth);
            expect(connectedEvmAuth).not.toBe(evmAuth); // Should be a new instance
        });
    });

    // Test getContract method
    describe('getContract', () => {
        it('should return the contract instance', () => {
            const contract = evmAuth.getContract();
            expect(contract).toBeDefined();
        });
    });

    // Test role constants accessors
    describe('role constants', () => {
        it('should return DEFAULT_ADMIN_ROLE', async () => {
            const role = await evmAuth.DEFAULT_ADMIN_ROLE();
            expect(role).toBe('0x00');
        });

        it('should return TOKEN_MANAGER_ROLE', async () => {
            const role = await evmAuth.TOKEN_MANAGER_ROLE();
            expect(role).toBe('0x01');
        });

        it('should return TOKEN_MINTER_ROLE', async () => {
            const role = await evmAuth.TOKEN_MINTER_ROLE();
            expect(role).toBe('0x02');
        });

        it('should return TOKEN_BURNER_ROLE', async () => {
            const role = await evmAuth.TOKEN_BURNER_ROLE();
            expect(role).toBe('0x03');
        });

        it('should return BLACKLIST_MANAGER_ROLE', async () => {
            const role = await evmAuth.BLACKLIST_MANAGER_ROLE();
            expect(role).toBe('0x04');
        });

        it('should return FINANCE_MANAGER_ROLE', async () => {
            const role = await evmAuth.FINANCE_MANAGER_ROLE();
            expect(role).toBe('0x05');
        });

        it('should return PROJECT_ID', async () => {
            const id = await evmAuth.PROJECT_ID();
            expect(id).toBe('0x06');
        });
    });

    // Test role management functions
    describe('role management', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should check if an account has a role', async () => {
            const hasRole = await evmAuth.hasRole('0x01', '0xaccount');
            expect(hasRole).toBe(true);
        });

        it('should grant a role to an account', async () => {
            const tx = await evmAuthWithSigner.grantRole('0x01', '0xaccount');
            expect(tx).toEqual({ hash: '0x123' });
        });

        it('should throw when granting a role without a signer', async () => {
            await expect(evmAuth.grantRole('0x01', '0xaccount')).rejects.toThrow(
                'Method requires a signer but none was provided'
            );
        });

        it('should grant multiple roles to an account', async () => {
            const tx = await evmAuthWithSigner.grantRoles(['0x01', '0x02'], '0xaccount');
            expect(tx).toEqual({ hash: '0x456' });
        });

        it('should revoke a role from an account', async () => {
            const tx = await evmAuthWithSigner.revokeRole('0x01', '0xaccount');
            expect(tx).toEqual({ hash: '0x789' });
        });

        it('should revoke multiple roles from an account', async () => {
            const tx = await evmAuthWithSigner.revokeRoles(['0x01', '0x02'], '0xaccount');
            expect(tx).toEqual({ hash: '0xabc' });
        });

        it('should renounce a role for an account', async () => {
            const tx = await evmAuthWithSigner.renounceRole('0x01', '0xaccount');
            expect(tx).toEqual({ hash: '0xdef' });
        });

        it('should get the admin role for a specific role', async () => {
            const adminRole = await evmAuth.getRoleAdmin('0x01');
            expect(adminRole).toBe('0x00');
        });
    });

    // Test token metadata functions
    describe('token metadata', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should get metadata for a token', async () => {
            const metadata = await evmAuth.metadataOf(1);
            expect(metadata).toEqual({
                id: BigInt(0),
                active: true,
                burnable: true,
                transferable: true,
                price: BigInt(100),
                ttl: BigInt(3600),
            });
        });

        it('should get metadata for all tokens', async () => {
            const metadataAll = await evmAuth.metadataOfAll();
            expect(metadataAll).toEqual([
                {
                    id: BigInt(0),
                    active: true,
                    burnable: true,
                    transferable: true,
                    price: BigInt(100),
                    ttl: BigInt(3600),
                },
            ]);
        });

        it('should get metadata for multiple tokens', async () => {
            const metadataBatch = await evmAuth.metadataOfBatch([1, 2]);
            expect(metadataBatch).toEqual([
                {
                    id: BigInt(0),
                    active: true,
                    burnable: true,
                    transferable: true,
                    price: BigInt(100),
                    ttl: BigInt(3600),
                },
            ]);
        });

        it('should get base metadata for a token', async () => {
            const baseMetadata = await evmAuth.baseMetadataOf(1);
            expect(baseMetadata).toEqual({
                id: BigInt(0),
                active: true,
                burnable: true,
                transferable: true,
            });
        });

        it('should get base metadata for all tokens', async () => {
            const baseMetadataAll = await evmAuth.baseMetadataOfAll();
            expect(baseMetadataAll).toEqual([
                {
                    id: BigInt(0),
                    active: true,
                    burnable: true,
                    transferable: true,
                },
            ]);
        });

        it('should get base metadata for multiple tokens', async () => {
            const baseMetadataBatch = await evmAuth.baseMetadataOfBatch([1, 2]);
            expect(baseMetadataBatch).toEqual([
                {
                    id: BigInt(0),
                    active: true,
                    burnable: true,
                    transferable: true,
                },
            ]);
        });

        it('should set token metadata', async () => {
            const tx = await evmAuthWithSigner.setMetadata(
                BigInt(1),
                true,
                true,
                true,
                BigInt(100),
                BigInt(3600)
            );
            expect(tx).toEqual({ hash: '0xa1b2' });
        });

        it('should throw when setting token metadata without a signer', async () => {
            await expect(
                evmAuth.setMetadata(BigInt(1), true, true, true, BigInt(100), BigInt(3600))
            ).rejects.toThrow('Method requires a signer but none was provided');
        });

        it('should set base token metadata', async () => {
            const tx = await evmAuthWithSigner.setBaseMetadata(BigInt(1), true, true, true);
            expect(tx).toEqual({ hash: '0xc3d4' });
        });
    });

    // Test token property accessors
    describe('token properties', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should check if a token is active', async () => {
            const isActive = await evmAuth.active(BigInt(1));
            expect(isActive).toBe(true);
        });

        it('should check if a token is burnable', async () => {
            const isBurnable = await evmAuth.burnable(BigInt(1));
            expect(isBurnable).toBe(true);
        });

        it('should check if a token is transferable', async () => {
            const isTransferable = await evmAuth.transferable(BigInt(1));
            expect(isTransferable).toBe(true);
        });

        it('should check if a token is for sale', async () => {
            const isForSale = await evmAuth.forSale(BigInt(1));
            expect(isForSale).toBe(true);
        });

        it('should get the price of a token', async () => {
            const price = await evmAuth.priceOf(BigInt(1));
            expect(price).toBe(BigInt(100));
        });

        it('should get prices for all tokens', async () => {
            const prices = await evmAuth.priceOfAll();
            expect(prices).toEqual([BigInt(100)]);
        });

        it('should get prices for multiple tokens', async () => {
            const prices = await evmAuth.priceOfBatch([BigInt(1), BigInt(2)]);
            expect(prices).toEqual([BigInt(100)]);
        });

        it('should set the price of a token', async () => {
            const tx = await evmAuthWithSigner.setPriceOf(BigInt(1), BigInt(200));
            expect(tx).toEqual({ hash: '0xe5f6' });
        });

        it('should set prices for multiple tokens', async () => {
            const tx = await evmAuthWithSigner.setPriceOfBatch(
                [BigInt(1), BigInt(2)],
                [BigInt(200), BigInt(300)]
            );
            expect(tx).toEqual({ hash: '0xg7h8' });
        });

        it('should get the time-to-live of a token', async () => {
            const ttl = await evmAuth.ttlOf(BigInt(1));
            expect(ttl).toBe(BigInt(3600));
        });

        it('should get time-to-live for all tokens', async () => {
            const ttls = await evmAuth.ttlOfAll();
            expect(ttls).toEqual([BigInt(3600)]);
        });

        it('should get time-to-live for multiple tokens', async () => {
            const ttls = await evmAuth.ttlOfBatch([BigInt(1), BigInt(2)]);
            expect(ttls).toEqual([BigInt(3600)]);
        });

        it('should set the time-to-live of a token', async () => {
            const tx = await evmAuthWithSigner.setTTL(BigInt(1), BigInt(7200));
            expect(tx).toEqual({ hash: '0xi9j0' });
        });

        it('should get the expiration time for a token', async () => {
            const expiration = await evmAuth.expirationFor(BigInt(1));
            expect(expiration).toBeDefined();
            expect(typeof expiration).toBe('bigint');
        });
    });

    // Test token balance functions
    describe('token balances', () => {
        it('should get the balance of a token for an account', async () => {
            const balance = await evmAuth.balanceOf('0xaccount', BigInt(1));
            expect(balance).toBe(BigInt(10));
        });

        it('should get balances for all tokens for an account', async () => {
            const balances = await evmAuth.balanceOfAll('0xaccount');
            expect(balances).toEqual([BigInt(10)]);
        });

        it('should get balances for multiple tokens and accounts', async () => {
            const balances = await evmAuth.balanceOfBatch(
                ['0xaccount1', '0xaccount2'],
                [BigInt(1), BigInt(2)]
            );
            expect(balances).toEqual([BigInt(10)]);
        });

        it('should get detailed balance information for a token and account', async () => {
            const details = await evmAuth.balanceDetailsOf('0xaccount', BigInt(1));
            expect(details).toHaveLength(1);
            expect(details[0].balance).toBeDefined();
            expect(details[0].expiresAt).toBeDefined();
        });

        it('should get detailed balance information for all tokens for an account', async () => {
            const detailsAll = await evmAuth.balanceDetailsOfAll('0xaccount');
            expect(detailsAll).toHaveLength(1);
            expect(detailsAll[0]).toHaveLength(1);
            expect(detailsAll[0][0].balance).toBeDefined();
            expect(detailsAll[0][0].expiresAt).toBeDefined();
        });

        it('should get detailed balance information for multiple tokens and accounts', async () => {
            const detailsBatch = await evmAuth.balanceDetailsOfBatch(
                ['0xaccount1', '0xaccount2'],
                [BigInt(1), BigInt(2)]
            );
            expect(detailsBatch).toHaveLength(1);
            expect(detailsBatch[0]).toHaveLength(1);
            expect(detailsBatch[0][0].balance).toBeDefined();
            expect(detailsBatch[0][0].expiresAt).toBeDefined();
        });
    });

    // Test token transfer and approval functions
    describe('token transfers and approvals', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should set approval for all tokens for an operator', async () => {
            const tx = await evmAuthWithSigner.setApprovalForAll('0xoperator', true);
            expect(tx).toEqual({ hash: '0xk1l2' });
        });

        it('should check if an operator is approved for all tokens by an account', async () => {
            const isApproved = await evmAuth.isApprovedForAll('0xaccount', '0xoperator');
            expect(isApproved).toBe(true);
        });

        it('should safely transfer a token from one account to another', async () => {
            const tx = await evmAuthWithSigner.safeTransferFrom(
                '0xfrom',
                '0xto',
                BigInt(1),
                BigInt(5)
            );
            expect(tx).toEqual({ hash: '0xm3n4' });
        });

        it('should safely transfer multiple tokens from one account to another', async () => {
            const tx = await evmAuthWithSigner.safeBatchTransferFrom(
                '0xfrom',
                '0xto',
                [BigInt(1), BigInt(2)],
                [BigInt(5), BigInt(10)]
            );
            expect(tx).toEqual({ hash: '0xo5p6' });
        });
    });

    // Test token minting and burning functions
    describe('token minting and burning', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should issue (mint) tokens to an account', async () => {
            const tx = await evmAuthWithSigner.issue('0xaccount', BigInt(1), BigInt(5));
            expect(tx).toEqual({ hash: '0xq7r8' });
        });

        it('should issue (mint) multiple tokens to an account', async () => {
            const tx = await evmAuthWithSigner.issueBatch(
                '0xaccount',
                [BigInt(1), BigInt(2)],
                [BigInt(5), BigInt(10)]
            );
            expect(tx).toEqual({ hash: '0xs9t0' });
        });

        it('should burn tokens from an account', async () => {
            const tx = await evmAuthWithSigner.burn('0xaccount', BigInt(1), BigInt(5));
            expect(tx).toEqual({ hash: '0xu1v2' });
        });

        it('should burn multiple tokens from an account', async () => {
            const tx = await evmAuthWithSigner.burnBatch(
                '0xaccount',
                [BigInt(1), BigInt(2)],
                [BigInt(5), BigInt(10)]
            );
            expect(tx).toEqual({ hash: '0xw3x4' });
        });
    });

    // Test purchase function
    describe('token purchase', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should purchase tokens for an account', async () => {
            const tx = await evmAuthWithSigner.purchase(
                '0xaccount',
                BigInt(1),
                BigInt(5),
                BigInt(500)
            );
            expect(tx).toEqual({ hash: '0xy5z6' });
        });
    });

    // Test blacklist management functions
    describe('blacklist management', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should check if an account is blacklisted', async () => {
            const isBlacklisted = await evmAuth.isBlacklisted('0xaccount');
            expect(isBlacklisted).toBe(false);
        });

        it('should add an account to the blacklist', async () => {
            const tx = await evmAuthWithSigner.addToBlacklist('0xaccount');
            expect(tx).toEqual({ hash: '0xa7b8' });
        });

        it('should add multiple accounts to the blacklist', async () => {
            const tx = await evmAuthWithSigner.addBatchToBlacklist(['0xaccount1', '0xaccount2']);
            expect(tx).toEqual({ hash: '0xc9d0' });
        });

        it('should remove an account from the blacklist', async () => {
            const tx = await evmAuthWithSigner.removeFromBlacklist('0xaccount');
            expect(tx).toEqual({ hash: '0xe1f2' });
        });

        it('should remove multiple accounts from the blacklist', async () => {
            const tx = await evmAuthWithSigner.removeBatchFromBlacklist([
                '0xaccount1',
                '0xaccount2',
            ]);
            expect(tx).toEqual({ hash: '0xg3h4' });
        });
    });

    // Test contract admin functions
    describe('contract admin', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should get the contract owner', async () => {
            const owner = await evmAuth.owner();
            expect(owner).toBe('0x123456');
        });

        it('should get the default admin address', async () => {
            const admin = await evmAuth.defaultAdmin();
            expect(admin).toBe('0x123456');
        });

        it('should get the pending default admin transfer details', async () => {
            const pendingAdmin = await evmAuth.pendingDefaultAdmin();
            expect(pendingAdmin).toEqual({ newAdmin: '0x654321', schedule: 123456 });
        });

        it('should begin a default admin transfer', async () => {
            const tx = await evmAuthWithSigner.beginDefaultAdminTransfer('0xnewadmin');
            expect(tx).toEqual({ hash: '0xi5j6' });
        });

        it('should accept a default admin transfer', async () => {
            const tx = await evmAuthWithSigner.acceptDefaultAdminTransfer();
            expect(tx).toEqual({ hash: '0xk7l8' });
        });

        it('should cancel a default admin transfer', async () => {
            const tx = await evmAuthWithSigner.cancelDefaultAdminTransfer();
            expect(tx).toEqual({ hash: '0xm9n0' });
        });

        it('should get the default admin delay', async () => {
            const delay = await evmAuth.defaultAdminDelay();
            expect(delay).toBe(86400);
        });

        it('should get the pending default admin delay change details', async () => {
            const pendingDelay = await evmAuth.pendingDefaultAdminDelay();
            expect(pendingDelay).toEqual({ newDelay: 172800, schedule: 123456 });
        });

        it('should change the default admin delay', async () => {
            const tx = await evmAuthWithSigner.changeDefaultAdminDelay(172800);
            expect(tx).toEqual({ hash: '0xo1p2' });
        });

        it('should rollback a default admin delay change', async () => {
            const tx = await evmAuthWithSigner.rollbackDefaultAdminDelay();
            expect(tx).toEqual({ hash: '0xq3r4' });
        });
    });

    // Test contract configuration functions
    describe('contract configuration', () => {
        let evmAuthWithSigner: EVMAuth;

        beforeEach(() => {
            evmAuthWithSigner = new EVMAuth(mockContractAddress, mockSigner);
        });

        it('should get the wallet address', async () => {
            const wallet = await evmAuth.wallet();
            expect(wallet).toBe('0xabcdef');
        });

        it('should set the wallet address', async () => {
            const tx = await evmAuthWithSigner.setWallet('0xnewwallet');
            expect(tx).toEqual({ hash: '0xs5t6' });
        });

        it('should get the URI', async () => {
            const uri = await evmAuth.uri(BigInt(1));
            expect(uri).toBe('https://example.com/token/{id}');
        });

        it('should set the URI', async () => {
            const tx = await evmAuthWithSigner.setURI('https://newexample.com/token/{id}');
            expect(tx).toEqual({ hash: '0xu7v8' });
        });

        it('should withdraw funds from the contract', async () => {
            const tx = await evmAuthWithSigner.withdraw();
            expect(tx).toEqual({ hash: '0xw9x0' });
        });
    });

    // Test event listener functions
    describe('event listeners', () => {
        it('should listen for token transfers', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onTransferSingle(mockCallback);

            expect(evmAuth.getContract().filters.TransferSingle).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for batch token transfers', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onTransferBatch(mockCallback);

            expect(evmAuth.getContract().filters.TransferBatch).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for approval events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onApprovalForAll(mockCallback);

            expect(evmAuth.getContract().filters.ApprovalForAll).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for token metadata update events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onTokenMetadataUpdated(mockCallback);

            expect(evmAuth.getContract().filters.TokenMetadataUpdated).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for token purchase events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onTokenPurchased(mockCallback);

            expect(evmAuth.getContract().filters.TokenPurchased).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for blacklist events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onAddedToBlacklist(mockCallback);

            expect(evmAuth.getContract().filters.AddedToBlacklist).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for removal from blacklist events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onRemovedFromBlacklist(mockCallback);

            expect(evmAuth.getContract().filters.RemovedFromBlacklist).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for expired tokens burned events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onExpiredTokensBurned(mockCallback);

            expect(evmAuth.getContract().filters.ExpiredTokensBurned).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for funds withdrawn events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onFundsWithdrawn(mockCallback);

            expect(evmAuth.getContract().filters.FundsWithdrawn).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for role granted events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onRoleGranted(mockCallback);

            expect(evmAuth.getContract().filters.RoleGranted).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });

        it('should listen for role revoked events', () => {
            const mockCallback = vi.fn();
            const removeListener = evmAuth.onRoleRevoked(mockCallback);

            expect(evmAuth.getContract().filters.RoleRevoked).toHaveBeenCalled();
            expect(evmAuth.getContract().on).toHaveBeenCalled();
            expect(typeof removeListener).toBe('function');
        });
    });
});
