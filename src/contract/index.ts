import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Address, WalletClient } from 'viem';
import { publicActions } from 'viem';
import { abiEVMAuth1155, abiEVMAuth6909 } from '../abi/index.js';
import { roles } from '../constants.js';
import type { DeploymentOptions, EVMAuthContractType } from '../types.js';

const contractABI = {
    EVMAuth1155: abiEVMAuth1155,
    EVMAuth6909: abiEVMAuth6909,
};

/**
 * Deploy and initialize an EVMAuth contract
 *
 * @param walletClient The wallet client used to deploy the contract
 * @param contractType The contract to deploy ('EVMAuth1155' or 'EVMAuth6909')
 * @param options Parameters passed to the contract initializer; if no initialDelay is provided, the default will be
 * zero seconds (no delay); if no initialDefaultAdmin or initialTreasury is provided, the deployer's address will be
 * used; if no roleGrants are provided, all roles will be granted to the deployer's address; if no uri is provided,
 * an empty string will be used
 * @returns The address of the deployed contract
 */
export const deployEVMAuth = async (
    walletClient: WalletClient,
    contractType: EVMAuthContractType,
    options: DeploymentOptions = {}
): Promise<Address> => {
    // Account used to deploy the contract
    const account = walletClient.account;
    if (!account) {
        throw new Error('Wallet client must have an associated account to deploy contracts');
    }

    // Extend the wallet client with public actions (e.g., waitForTransactionReceipt)
    const client = walletClient.extend(publicActions);

    // Set default options
    const initialDelay = options.initialDelay ?? 0;
    const initialDefaultAdmin = options.initialDefaultAdmin ?? account.address;
    const initialTreasury = options.initialTreasury ?? account.address;
    const roleGrants = options.roleGrants ?? [
        { role: roles.UPGRADE_MANAGER_ROLE, account: account.address },
        { role: roles.ACCESS_MANAGER_ROLE, account: account.address },
        { role: roles.TOKEN_MANAGER_ROLE, account: account.address },
        { role: roles.MINTER_ROLE, account: account.address },
        { role: roles.BURNER_ROLE, account: account.address },
        { role: roles.TREASURER_ROLE, account: account.address },
    ];
    const uri = options.uri ?? '';

    // Read implementation bytecode
    const bytecode = readFileSync(
        join(process.cwd(), 'src', `${contractType}.bin`),
        'utf-8'
    ).trim() as `0x${string}`;

    // Deploy the contract by sending a transaction with the contract bytecode
    const hash = await client.sendTransaction({
        data: bytecode,
        to: null,
        chain: client.chain,
        account,
    });

    // Wait for the deployment transaction to be mined
    const deployReceipt = await client.waitForTransactionReceipt({ hash });
    if (deployReceipt.status !== 'success') {
        throw new Error(`Failed to deploy ${contractType}`);
    }

    // Get the deployed contract address from the transaction receipt
    const contractAddress = deployReceipt.contractAddress;
    if (!contractAddress) {
        throw new Error(`Failed to deploy ${contractType}`);
    }

    // Initialize the contract
    const initHash = await walletClient.writeContract({
        address: contractAddress,
        abi: contractABI[contractType],
        functionName: 'initialize',
        args: [initialDelay, initialDefaultAdmin, initialTreasury, roleGrants, uri],
        chain: walletClient.chain,
        account,
    });

    // Wait for the initialization transaction to be mined
    const initReceipt = await client.waitForTransactionReceipt({ hash: initHash });
    if (initReceipt.status !== 'success') {
        throw new Error(`Failed to initialize ${contractType}`);
    }

    return contractAddress;
};
