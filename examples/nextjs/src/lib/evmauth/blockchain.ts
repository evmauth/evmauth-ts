import { type BrowserProvider, JsonRpcProvider, Wallet } from 'ethers';
import { EVMAuth } from 'evmauth';
import { ENV, validateDemoWalletConfig } from './config';
import { logger } from './logger';
import { getTokenMetadata } from './token-utils';
import type { TokenValidationResult } from './types';

/**
 * IMPORTANT SECURITY NOTICE:
 *
 * The mintTokenWithDemoWallet function and other demo wallet utilities are intended
 * for local development and demonstration purposes ONLY. Never use these in a
 * production environment or with a wallet containing real funds.
 *
 * For production use cases:
 * 1. Implement proper wallet connection (MetaMask, WalletConnect, etc.)
 * 2. Use a secure backend for sensitive operations
 * 3. Never expose private keys in client-side code
 */

// Initialization state
let provider: JsonRpcProvider | null = null;
let evmauth: EVMAuth | null = null;

/**
 * Initialize the blockchain service
 * Creates the provider and EVMAuth instance with the latest environment variables
 */
export async function initBlockchainService(): Promise<void> {
    try {
        if (!ENV.EVMAUTH_RPC_URL) {
            throw new Error('EVMAUTH_RPC_URL environment variable is not set');
        }

        if (!ENV.EVMAUTH_CONTRACT_ADDRESS) {
            throw new Error('EVMAUTH_CONTRACT_ADDRESS environment variable is not set');
        }

        // Always create a new provider to use the latest environment variables
        provider = new JsonRpcProvider(ENV.EVMAUTH_RPC_URL);

        // Create EVMAuth instance with provider
        evmauth = new EVMAuth(ENV.EVMAUTH_CONTRACT_ADDRESS, provider);
    } catch (error) {
        console.error('Failed to initialize blockchain service:', error);
        throw error;
    }
}

/**
 * Get the EVMAuth instance
 * @returns The EVMAuth instance
 */
export function getEVMAuth(): EVMAuth {
    if (!evmauth) {
        throw new Error('Blockchain service not initialized. Call initBlockchainService first.');
    }
    return evmauth;
}

/**
 * Get the contract interface from EVMAuth
 * @returns The contract interface object
 */
export function getContractInterface() {
    try {
        const auth = getEVMAuth();
        const contract = auth.getContract();
        return contract.interface;
    } catch (error) {
        logger.error({
            category: 'api',
            message: `Failed to get contract interface: ${error}`,
            component: 'blockchain',
            data: { error },
        });
        throw new Error(
            `Failed to get contract interface: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Create a signer from a private key
 * @param privateKey The private key to use for signing
 * @returns A wallet signer
 */
export function getSigner(privateKey: string): Wallet {
    if (!provider) {
        throw new Error('Blockchain service not initialized. Call initBlockchainService first.');
    }
    return new Wallet(privateKey, provider);
}

/**
 * Get the token balance for a wallet
 * @param walletAddress The wallet address to check
 * @param tokenId The token ID to check
 * @returns The token balance as a bigint
 */
export async function getTokenBalance(walletAddress: string, tokenId: number): Promise<bigint> {
    try {
        await initBlockchainService();
        const auth = getEVMAuth();
        return await auth.balanceOf(walletAddress, tokenId);
    } catch (error) {
        console.error(`Failed to get token balance for ${walletAddress}, token ${tokenId}:`, error);
        // Re-throw the error to properly test different error conditions
        throw error;
    }
}

/**
 * Check if a wallet has the required tokens
 * @param walletAddress The wallet address to check
 * @param tokenId The token ID to check
 * @param requiredAmount The required amount of tokens
 * @returns True if the wallet has the required tokens
 */
export async function hasRequiredTokens(
    walletAddress: string,
    tokenId: number,
    requiredAmount: number
): Promise<boolean> {
    try {
        const balance = await getTokenBalance(walletAddress, tokenId);
        return balance >= BigInt(requiredAmount);
    } catch (error) {
        console.error(`Failed to check token requirement for ${walletAddress}:`, error);
        return false;
    }
}

/**
 * Validate if a wallet has the required tokens
 * @param walletAddress The wallet address to check
 * @param tokenId The token ID to check
 * @param requiredAmount The required amount of tokens
 * @returns A TokenValidationResult object
 */
export async function validateTokenRequirement(
    walletAddress: string,
    tokenId: number,
    requiredAmount: number
): Promise<TokenValidationResult> {
    try {
        // Check wallet format first
        if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            return {
                isValid: false,
                walletAddress,
                tokenId,
                requiredAmount,
                errorCode: 'AUTH_INVALID',
                message: 'Invalid wallet address format',
                retryable: true,
            };
        }

        try {
            // Get token balance
            const balance = await getTokenBalance(walletAddress, tokenId);

            // Check if has enough tokens
            if (balance >= BigInt(requiredAmount)) {
                return {
                    isValid: true,
                    walletAddress,
                    tokenId,
                    requiredAmount,
                    actualBalance: balance,
                };
            }

            // Different error codes based on balance
            if (balance === BigInt(0)) {
                return {
                    isValid: false,
                    walletAddress,
                    tokenId,
                    requiredAmount,
                    actualBalance: balance,
                    errorCode: 'TOKEN_MISSING',
                    message: `You need at least ${requiredAmount} of token #${tokenId} to access this resource`,
                    retryable: true,
                };
            }

            return {
                isValid: false,
                walletAddress,
                tokenId,
                requiredAmount,
                actualBalance: balance,
                errorCode: 'TOKEN_INSUFFICIENT',
                message: `You need at least ${requiredAmount} of token #${tokenId}, but you only have ${balance.toString()}`,
                retryable: true,
            };
        } catch (_error) {
            // Handle blockchain error specifically
            return {
                isValid: false,
                walletAddress,
                tokenId,
                requiredAmount,
                errorCode: 'CONTRACT_ERROR',
                message: 'Error connecting to blockchain. Please try again later.',
                retryable: true,
            };
        }
    } catch (error) {
        console.error(`Token validation error for ${walletAddress}:`, error);

        return {
            isValid: false,
            walletAddress,
            tokenId,
            requiredAmount,
            errorCode: 'CONTRACT_ERROR',
            message: 'Error connecting to blockchain. Please try again later.',
            retryable: true,
        };
    }
}

/**
 * Get token information from the blockchain
 * @param tokenId The token ID to get information for
 * @returns The token metadata from the blockchain
 */

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function getTokenInfo(tokenId: number): Promise<any> {
    try {
        await initBlockchainService();
        const auth = getEVMAuth();

        // Get token metadata from contract
        const metadata = await auth.metadataOf(tokenId);

        return {
            id: Number(metadata.id),
            active: metadata.active,
            burnable: metadata.burnable,
            transferable: metadata.transferable,
            price: metadata.price.toString(),
            ttl: Number(metadata.ttl),
        };
    } catch (error) {
        console.error(`Failed to get token info for token ${tokenId}:`, error);
        throw error;
    }
}

/**
 * Purchase a token using the demo wallet
 * For local development and demos only
 * @param tokenId The token ID to acquire
 * @returns Transaction hash
 */
export async function mintTokenWithDemoWallet(tokenId: number): Promise<string> {
    logger.debug({
        category: 'api',
        message: `Purchasing token ${tokenId} with demo wallet`,
        component: 'blockchain',
    });

    try {
        // Validate the demo wallet configuration
        validateDemoWalletConfig();

        // Initialize blockchain service if needed
        await initBlockchainService();

        // Get wallet from private key
        const demoWallet = getSigner(ENV.DEMO_PRIVATE_KEY);
        const walletAddress = await demoWallet.getAddress();

        logger.debug({
            category: 'api',
            message: `Using demo wallet: ${walletAddress}`,
            component: 'blockchain',
        });

        // Initialize EVMAuth (already called via getTokenInfo)

        // Get token info to determine price
        let tokenPrice: bigint;
        try {
            const tokenInfo = await getTokenInfo(tokenId);
            tokenPrice = tokenInfo.price ? BigInt(tokenInfo.price) : BigInt(0);

            logger.debug({
                category: 'api',
                message: `Token ${tokenId} price: ${tokenPrice.toString()}`,
                component: 'blockchain',
            });
        } catch (error) {
            logger.error({
                category: 'api',
                message: 'Failed to get token price from contract',
                component: 'blockchain',
                data: { error },
            });

            // Use prices from token metadata as fallback
            const tokenMetadata = getTokenMetadata(tokenId);

            if (tokenMetadata?.ethPriceWei) {
                tokenPrice = BigInt(tokenMetadata.ethPriceWei);
            } else {
                // Fallback hardcoded prices if metadata is missing
                const tokenPrices: Record<number, bigint> = {
                    0: BigInt('50000000000000000'), // 0.05 ETH for token 0
                    1: BigInt('200000000000000000'), // 0.2 ETH for token 1
                };

                tokenPrice = tokenPrices[tokenId] || BigInt('50000000000000000'); // Default to 0.05 ETH
            }

            logger.info({
                category: 'api',
                message: `Using fallback price for token ${tokenId}: ${tokenPrice.toString()}`,
                component: 'blockchain',
            });
        }

        // Get the contract interface
        const contractInterface = getContractInterface();

        // Encode the function call to purchase
        const data = contractInterface.encodeFunctionData('purchase', [
            walletAddress, // recipient (ourselves)
            tokenId, // token ID to purchase
            1, // amount (just 1 token)
        ]);

        logger.info({
            category: 'api',
            message: `Preparing to send purchase transaction for token ${tokenId}`,
            component: 'blockchain',
            data: { tokenId, walletAddress, tokenPrice: tokenPrice.toString() },
        });

        // Send the transaction
        const tx = await demoWallet.sendTransaction({
            to: ENV.EVMAUTH_CONTRACT_ADDRESS,
            data,
            value: tokenPrice,
            gasLimit: BigInt(300000),
        });

        logger.info({
            category: 'api',
            message: `Purchase transaction sent: ${tx.hash}`,
            component: 'blockchain',
            data: { tokenId, walletAddress, txHash: tx.hash },
        });

        // Wait for transaction confirmation
        logger.debug({
            category: 'api',
            message: 'Waiting for transaction confirmation...',
            component: 'blockchain',
        });

        const receipt = await tx.wait(1);

        if (!receipt || receipt.status === 0) {
            throw new Error('Transaction failed on the blockchain');
        }

        logger.info({
            category: 'api',
            message: `Token ${tokenId} purchased successfully`,
            component: 'blockchain',
            data: { tokenId, txHash: tx.hash, blockNumber: receipt.blockNumber },
        });

        return tx.hash;
    } catch (error) {
        logger.error({
            category: 'api',
            message: `Error purchasing token: ${error}`,
            component: 'blockchain',
            data: { error },
        });

        throw new Error(
            `Failed to purchase token: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Get token balance for the demo wallet from the blockchain
 * @param tokenId The token ID to check
 * @returns The actual token balance as a bigint
 */
export async function getDemoWalletTokenBalance(tokenId: number): Promise<bigint> {
    try {
        validateDemoWalletConfig();

        logger.debug({
            category: 'api',
            message: `Checking demo wallet balance for token ${tokenId}`,
            component: 'blockchain',
        });

        // Get the actual balance from the blockchain
        const balance = await getTokenBalance(ENV.DEMO_WALLET_ADDRESS, tokenId);

        logger.debug({
            category: 'api',
            message: `Demo wallet balance for token ${tokenId}: ${balance.toString()}`,
            component: 'blockchain',
            data: { tokenId, balance: balance.toString() },
        });

        return balance;
    } catch (error) {
        logger.error({
            category: 'api',
            message: `Failed to get demo wallet token balance for token ${tokenId}`,
            component: 'blockchain',
            data: { error },
        });
        throw error;
    }
}

/**
 * Check if the demo wallet has the required tokens on the blockchain
 * @param tokenId The token ID to check
 * @param requiredAmount The required amount of tokens
 * @returns True if the wallet has the required tokens
 */
export async function demoWalletHasRequiredTokens(
    tokenId: number,
    requiredAmount: number
): Promise<boolean> {
    try {
        validateDemoWalletConfig();

        logger.debug({
            category: 'api',
            message: `Checking if demo wallet has ${requiredAmount} of token ${tokenId}`,
            component: 'blockchain',
        });

        // Get the actual balance
        const balance = await getDemoWalletTokenBalance(tokenId);

        // Check if it meets the requirement
        const hasRequiredTokens = balance >= BigInt(requiredAmount);

        logger.debug({
            category: 'api',
            message: `Demo wallet token requirement check: ${hasRequiredTokens ? 'PASSED' : 'FAILED'}`,
            component: 'blockchain',
            data: {
                tokenId,
                requiredAmount,
                actualBalance: balance.toString(),
                hasRequiredTokens,
            },
        });

        return hasRequiredTokens;
    } catch (error) {
        logger.error({
            category: 'api',
            message: 'Failed to check demo wallet token requirement',
            component: 'blockchain',
            data: { error, tokenId, requiredAmount },
        });
        throw error;
    }
}

/**
 * DEPRECATED: Use mintTokenWithDemoWallet instead for local development
 * This function requires a browser wallet connection and is being phased out
 *
 * Mint a new token for a user
 * @param walletProvider A web3 provider (BrowserProvider or similar)
 * @param to Recipient wallet address
 * @param tokenId The token ID to mint
 * @returns Transaction hash
 */
export async function mintToken(
    walletProvider: BrowserProvider,
    to: string,
    tokenId: number
): Promise<string> {
    logger.debug({
        category: 'api',
        message: `DEPRECATED: Minting token ${tokenId} to address ${to} using browser wallet`,
        component: 'blockchain',
    });

    try {
        // Get signer from provider
        const signer = await walletProvider.getSigner();

        // Ensure wallet is connected
        const signerAddress = await signer.getAddress();
        logger.debug({
            category: 'api',
            message: `Signer address: ${signerAddress}`,
            component: 'blockchain',
        });

        // Initialize EVMAuth with the signer
        await initBlockchainService();
        const auth = getEVMAuth();

        // Create a compatible signer object
        const compatibleSigner = {
            signMessage: (message: string | Uint8Array) => signer.signMessage(message),
            provider: provider as JsonRpcProvider,
        };

        const signerConnectedAuth = auth.connect(compatibleSigner);

        // Call mint function on the contract
        // Issue a token (equivalent to minting)
        const tx = await signerConnectedAuth.issue(to, tokenId, 1);
        logger.debug({
            category: 'api',
            message: `Transaction hash: ${tx.hash}`,
            component: 'blockchain',
        });

        // Wait for transaction to be mined
        const receipt = await tx.wait();
        logger.debug({
            category: 'api',
            message: `Transaction confirmed in block: ${receipt?.blockNumber}`,
            component: 'blockchain',
        });

        return tx.hash;
    } catch (error) {
        logger.error({
            category: 'api',
            message: `Failed to mint token: ${error}`,
            component: 'blockchain',
            data: { error },
        });
        throw new Error(
            `Failed to mint token: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
