import type {
    Address,
    GetContractReturnType,
    Hash,
    PublicClient,
    TransactionReceipt,
    WalletClient,
} from 'viem';
import { getContract } from 'viem';
import { evmAuth1155Abi } from './abis/evmAuth1155.js';
import { evmAuth6909Abi } from './abis/evmAuth6909.js';

type EVMAuth1155Contract = GetContractReturnType<
    typeof evmAuth1155Abi,
    PublicClient | WalletClient
>;

type EVMAuth6909Contract = GetContractReturnType<
    typeof evmAuth6909Abi,
    PublicClient | WalletClient
>;

export type EVMAuthContract = EVMAuth1155Contract | EVMAuth6909Contract;

/**
 * Purchase tokens with native currency, automatically calculating the total cost
 * @param contract The EVMAuth contract instance (1155 or 6909)
 * @param tokenId The token ID to purchase
 * @param amount The amount of tokens to purchase
 * @returns The transaction hash
 */
export async function purchaseWithNative(
    contract: EVMAuthContract,
    tokenId: bigint,
    amount: bigint
): Promise<Hash> {
    const price = (await contract.read.tokenPrice([tokenId])) as bigint;
    const totalCost = price * amount;
    return contract.write.purchase([tokenId, amount], { value: totalCost }) as Promise<Hash>;
}

/**
 * Purchase tokens for another address with native currency
 * @param contract The EVMAuth contract instance (1155 or 6909)
 * @param receiver The address to receive the tokens
 * @param tokenId The token ID to purchase
 * @param amount The amount of tokens to purchase
 * @returns The transaction hash
 */
export async function purchaseForWithNative(
    contract: EVMAuthContract,
    receiver: Address,
    tokenId: bigint,
    amount: bigint
): Promise<Hash> {
    const price = (await contract.read.tokenPrice([tokenId])) as bigint;
    const totalCost = price * amount;
    return contract.write.purchaseFor([receiver, tokenId, amount], {
        value: totalCost,
    }) as Promise<Hash>;
}

/**
 * Extract token ID from a token creation transaction receipt
 * @param receipt The transaction receipt from createToken
 * @returns The created token ID
 */
export function getTokenIdFromCreation(receipt: TransactionReceipt): bigint {
    // Look for EVMAuthTokenConfigured event in the logs
    for (const log of receipt.logs) {
        // The event signature for EVMAuthTokenConfigured
        // First topic is the event signature hash
        if (log.topics.length > 1 && log.topics[1]) {
            try {
                // Token ID is the first indexed parameter (second topic)
                const tokenId = BigInt(log.topics[1]);
                return tokenId;
            } catch {
                // Continue to next log if this isn't the right event
            }
        }
    }

    throw new Error('Failed to extract token ID from transaction receipt');
}

/**
 * Helper to check if a user has sufficient balance for a time-gated action
 * @param contract The EVMAuth contract instance
 * @param account The account to check
 * @param tokenId The token ID
 * @param requiredAmount The minimum amount required
 * @returns True if the account has sufficient active balance
 */
export async function hasActiveBalance(
    contract: EVMAuthContract,
    account: Address,
    tokenId: bigint,
    requiredAmount: bigint
): Promise<boolean> {
    const balance = (await contract.read.balanceOf([account, tokenId])) as bigint;
    return balance >= requiredAmount;
}

/**
 * Helper to check if a token is purchasable with a specific ERC20 token
 * @param contract The EVMAuth contract instance
 * @param tokenId The token ID
 * @param paymentToken The ERC20 payment token address
 * @returns True if the payment token is accepted
 */
export async function canPurchaseWithERC20(
    contract: EVMAuthContract,
    tokenId: bigint,
    paymentToken: Address
): Promise<boolean> {
    return contract.read.isAcceptedERC20PaymentToken([tokenId, paymentToken]) as Promise<boolean>;
}

/**
 * Create a contract instance for EVMAuth1155
 */
export function getEVMAuth1155<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
) {
    return getContract({
        address,
        abi: evmAuth1155Abi,
        client,
    });
}

/**
 * Create a contract instance for EVMAuth6909
 */
export function getEVMAuth6909<TClient extends PublicClient | WalletClient>(
    address: Address,
    client: TClient
) {
    return getContract({
        address,
        abi: evmAuth6909Abi,
        client,
    });
}

// Re-export the role constants for convenience
export const ROLES = {
    DEFAULT_ADMIN: 'DEFAULT_ADMIN_ROLE',
    UPGRADE_MANAGER: 'UPGRADE_MANAGER_ROLE',
    ACCESS_MANAGER: 'ACCESS_MANAGER_ROLE',
    TOKEN_MANAGER: 'TOKEN_MANAGER_ROLE',
    MINTER: 'MINTER_ROLE',
    BURNER: 'BURNER_ROLE',
    TREASURER: 'TREASURER_ROLE',
} as const;
