import type { Account, Address, Hex } from 'viem';
import type {
    EVMAuthAccessManagerClient,
    EVMAuthAdminClient,
    EVMAuthBurnerClient,
    EVMAuthMinterClient,
    EVMAuthPublicClient,
    EVMAuthTokenManagerClient,
    EVMAuthTreasurerClient,
} from '../../client/index.js';
import { clients } from '../../client/index.js';
import { roles } from '../../constants.js';
import { deployEVMAuth } from '../../contract/index.js';
import { vm } from './anvil.js';

export class TestHarness {
    public owner = vm.makeAddr();
    public ownerWallet;

    public accessManager = vm.makeAddr('accessManager');
    public accessManagerWallet;

    public tokenManager = vm.makeAddr('tokenManager');
    public tokenManagerWallet;

    public minter = vm.makeAddr('minter');
    public minterWallet;

    public burner = vm.makeAddr('burner');
    public burnerWallet;

    public treasurer = vm.makeAddr('treasurer');
    public treasurerWallet;

    public contractType: 'EVMAuth1155' | 'EVMAuth6909';
    public contractAddress: Address;
    public treasuryAddress: Address;

    public accessManagerClient: EVMAuthAccessManagerClient;
    public adminClient: EVMAuthAdminClient;
    public tokenManagerClient: EVMAuthTokenManagerClient;
    public minterClient: EVMAuthMinterClient;
    public burnerClient: EVMAuthBurnerClient;
    public treasurerClient: EVMAuthTreasurerClient;

    protected snapshotId: Hex;
    protected isInitialized: boolean;

    constructor(contractType: 'EVMAuth1155' | 'EVMAuth6909') {
        this.ownerWallet = vm.createWalletClient(this.owner);
        this.accessManagerWallet = vm.createWalletClient(this.accessManager);
        this.tokenManagerWallet = vm.createWalletClient(this.tokenManager);
        this.minterWallet = vm.createWalletClient(this.minter);
        this.burnerWallet = vm.createWalletClient(this.burner);
        this.treasurerWallet = vm.createWalletClient(this.treasurer);

        this.contractType = contractType;
        this.contractAddress = '0x0' as Address;
        this.treasuryAddress = vm.makeAddr().address;

        this.adminClient = {} as EVMAuthAdminClient;
        this.accessManagerClient = {} as EVMAuthAccessManagerClient;
        this.tokenManagerClient = {} as EVMAuthTokenManagerClient;
        this.minterClient = {} as EVMAuthMinterClient;
        this.burnerClient = {} as EVMAuthBurnerClient;
        this.treasurerClient = {} as EVMAuthTreasurerClient;

        this.snapshotId = '0x0' as Hex;
        this.isInitialized = false;
    }

    init = async () => {
        // If already initialized, revert to the snapshot
        if (this.isInitialized) {
            await vm.revertTo(this.snapshotId);
            // Reverting deletes the snapshot, so create a new one
            this.snapshotId = await vm.snapshot();
            return;
        }

        // Fund all test accounts with ETH for gas
        await Promise.all([
            vm.deal(this.owner.address, '10'),
            vm.deal(this.accessManager.address, '10'),
            vm.deal(this.tokenManager.address, '10'),
            vm.deal(this.minter.address, '10'),
            vm.deal(this.burner.address, '10'),
            vm.deal(this.treasurer.address, '10'),
        ]);

        // Deploy and initialize the contract
        this.contractAddress = await deployEVMAuth(this.ownerWallet, this.contractType, {
            initialDelay: 1, // 1 second delay for testing
            initialDefaultAdmin: this.owner.address,
            initialTreasury: this.treasuryAddress,
            roleGrants: [
                { role: roles.UPGRADE_MANAGER_ROLE, account: this.owner.address },
                { role: roles.ACCESS_MANAGER_ROLE, account: this.accessManager.address },
                { role: roles.TOKEN_MANAGER_ROLE, account: this.tokenManager.address },
                { role: roles.MINTER_ROLE, account: this.minter.address },
                { role: roles.BURNER_ROLE, account: this.burner.address },
                { role: roles.TREASURER_ROLE, account: this.treasurer.address },
            ],
        });

        // Create SDK instances for each role
        this.adminClient = clients[this.contractType].createAdminClient(
            this.contractAddress,
            this.ownerWallet
        );
        this.accessManagerClient = clients[this.contractType].createAccessManagerClient(
            this.contractAddress,
            this.accessManagerWallet
        );
        this.tokenManagerClient = clients[this.contractType].createTokenManagerClient(
            this.contractAddress,
            this.tokenManagerWallet
        );
        this.minterClient = clients[this.contractType].createMinterClient(
            this.contractAddress,
            this.minterWallet
        );
        this.burnerClient = clients[this.contractType].createBurnerClient(
            this.contractAddress,
            this.burnerWallet
        );
        this.treasurerClient = clients[this.contractType].createTreasurerClient(
            this.contractAddress,
            this.treasurerWallet
        );

        // Take a snapshot of the current state
        this.snapshotId = await vm.snapshot();
        this.isInitialized = true;
    };

    createAdminClient(account: Account = vm.makeAddr()): EVMAuthAdminClient {
        const wallet = vm.createWalletClient(account);
        return clients[this.contractType].createAdminClient(this.contractAddress, wallet);
    }

    createAccessManagerClient(account: Account = vm.makeAddr()): EVMAuthAccessManagerClient {
        const wallet = vm.createWalletClient(account);
        return clients[this.contractType].createAccessManagerClient(this.contractAddress, wallet);
    }

    createBurnerClient(account: Account = vm.makeAddr()): EVMAuthBurnerClient {
        const wallet = vm.createWalletClient(account);
        return clients[this.contractType].createBurnerClient(this.contractAddress, wallet);
    }

    createPublicClient(account: Account = vm.makeAddr()): EVMAuthPublicClient {
        const wallet = vm.createWalletClient(account);
        return clients[this.contractType].createPublicClient(this.contractAddress, wallet);
    }

    createMinterClient(account: Account = vm.makeAddr()): EVMAuthMinterClient {
        const wallet = vm.createWalletClient(account);
        return clients[this.contractType].createMinterClient(this.contractAddress, wallet);
    }

    createTokenManagerClient(account: Account = vm.makeAddr()): EVMAuthTokenManagerClient {
        const wallet = vm.createWalletClient(account);
        return clients[this.contractType].createTokenManagerClient(this.contractAddress, wallet);
    }

    createTreasurerClient(account: Account = vm.makeAddr()): EVMAuthTreasurerClient {
        const wallet = vm.createWalletClient(account);
        return clients[this.contractType].createTreasurerClient(this.contractAddress, wallet);
    }

    getTxGasCost = async (txHash: `0x${string}`) => {
        const txReceipt = await vm.publicClient.getTransactionReceipt({ hash: txHash });
        const gasUsed = txReceipt?.gasUsed ?? 0n;
        const tx = await vm.publicClient.getTransaction({ hash: txHash });
        const gasPrice = tx?.gasPrice ?? 0n;
        return gasUsed * gasPrice;
    };
}
