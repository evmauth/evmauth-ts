import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    type Address,
    type Hash,
    type PublicClient,
    type WalletClient,
    keccak256,
    toHex,
} from 'viem';
import { evmAuth1155Abi } from '../abis/evmAuth1155.js';
import { evmAuth6909Abi } from '../abis/evmAuth6909.js';

interface DeploymentOptions {
    initialDelay?: number;
    initialDefaultAdmin?: Address;
    initialTreasury?: Address;
    roleGrants?: Array<{ role: Hash; account: Address }>;
    uri?: string;
}

/**
 * Deploy EVMAuth1155 contract directly (without proxy for testing)
 * Note: In production, these contracts should be deployed as upgradeable proxies
 */
export async function deployEVMAuth1155(
    publicClient: PublicClient,
    walletClient: WalletClient,
    options: DeploymentOptions = {}
): Promise<Address> {
    const account = walletClient.account?.address;
    if (!account) throw new Error('No account found in wallet client');

    // Role constants (these are keccak256 hashes of the role names)
    const TOKEN_MANAGER_ROLE = keccak256(toHex('TOKEN_MANAGER_ROLE'));
    const MINTER_ROLE = keccak256(toHex('MINTER_ROLE'));
    const BURNER_ROLE = keccak256(toHex('BURNER_ROLE'));

    // Default values
    const initialDelay = options.initialDelay ?? 0;
    const initialDefaultAdmin = options.initialDefaultAdmin ?? account;
    const initialTreasury = options.initialTreasury ?? account;
    // Grant TOKEN_MANAGER_ROLE to the deployer by default for testing
    const roleGrants = options.roleGrants ?? [
        { role: TOKEN_MANAGER_ROLE, account },
        { role: MINTER_ROLE, account },
        { role: BURNER_ROLE, account },
    ];
    const uri = options.uri ?? '';

    // Read implementation bytecode
    const bytecode = readFileSync(
        join(process.cwd(), 'src', 'EVMAuth1155.bin'),
        'utf-8'
    ).trim() as `0x${string}`;

    // Deploy the contract by sending a transaction with the deploy data
    const hash = await walletClient.sendTransaction({
        data: bytecode,
        to: null,
        chain: walletClient.chain,
        account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const contractAddress = receipt.contractAddress;
    if (!contractAddress) throw new Error('Failed to deploy EVMAuth1155');

    // Initialize the contract
    const initHash = await walletClient.writeContract({
        address: contractAddress,
        abi: evmAuth1155Abi,
        functionName: 'initialize',
        args: [initialDelay, initialDefaultAdmin, initialTreasury, roleGrants, uri],
        chain: walletClient.chain,
        account: null,
    });

    await publicClient.waitForTransactionReceipt({ hash: initHash });

    return contractAddress;
}

/**
 * Deploy EVMAuth6909 contract directly (without proxy for testing)
 * Note: In production, these contracts should be deployed as upgradeable proxies
 */
export async function deployEVMAuth6909(
    publicClient: PublicClient,
    walletClient: WalletClient,
    options: DeploymentOptions = {}
): Promise<Address> {
    const account = walletClient.account?.address;
    if (!account) throw new Error('No account found in wallet client');

    // Role constants (these are keccak256 hashes of the role names)
    const TOKEN_MANAGER_ROLE = keccak256(toHex('TOKEN_MANAGER_ROLE'));
    const MINTER_ROLE = keccak256(toHex('MINTER_ROLE'));
    const BURNER_ROLE = keccak256(toHex('BURNER_ROLE'));

    // Default values
    const initialDelay = options.initialDelay ?? 0;
    const initialDefaultAdmin = options.initialDefaultAdmin ?? account;
    const initialTreasury = options.initialTreasury ?? account;
    // Grant TOKEN_MANAGER_ROLE to the deployer by default for testing
    const roleGrants = options.roleGrants ?? [
        { role: TOKEN_MANAGER_ROLE, account },
        { role: MINTER_ROLE, account },
        { role: BURNER_ROLE, account },
    ];
    const uri = options.uri ?? '';

    // Read implementation bytecode
    const bytecode = readFileSync(
        join(process.cwd(), 'src', 'EVMAuth6909.bin'),
        'utf-8'
    ).trim() as `0x${string}`;

    // Deploy the contract by sending a transaction with the deploy data
    const hash = await walletClient.sendTransaction({
        data: bytecode,
        to: null,
        chain: walletClient.chain,
        account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const contractAddress = receipt.contractAddress;
    if (!contractAddress) throw new Error('Failed to deploy EVMAuth6909');

    // Initialize the contract
    const initHash = await walletClient.writeContract({
        address: contractAddress,
        abi: evmAuth6909Abi,
        functionName: 'initialize',
        args: [initialDelay, initialDefaultAdmin, initialTreasury, roleGrants, uri],
        chain: walletClient.chain,
        account: null,
    });

    await publicClient.waitForTransactionReceipt({ hash: initHash });

    return contractAddress;
}
