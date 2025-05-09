import type { JsonRpcProvider, Wallet } from 'ethers';
import { ethers } from 'ethers';
import { EVMAuth, type TokenMetadata } from 'evmauth';
import { contractAddress, privateKey, rpcUrl } from './config.js';

const provider: JsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl);
const signer: Wallet = new ethers.Wallet(privateKey, provider);

/**
 * EVMAuth instance for interacting with the smart contract (read-only).
 * @type {EVMAuth}
 */
export const auth: EVMAuth = new EVMAuth(contractAddress, provider);

/**
 * EVMAuth instance for interacting with the smart contract (read/write).
 * @type {EVMAuth}
 */
export const evmAuthSigner: EVMAuth | null = privateKey ? auth.connect(signer) : null;

/**
 * Initialize the token metadata, updating only if necessary.
 * @param {TokenMetadata[]} tokenConfig - Array of token metadata objects.
 * @returns {Promise<void>}
 */
export async function setTokenMetadata(tokenConfig: TokenMetadata[]): Promise<void> {
    if (!evmAuthSigner) {
        console.warn('Signer is not initialized. Cannot set token metadata.');
        return;
    }

    const currentConfig: TokenMetadata[] = await auth.metadataOfAll();
    const promises: Promise<ethers.ContractTransactionResponse>[] = [];

    for (let tokenId = 0; tokenId < tokenConfig.length; tokenId++) {
        if (
            currentConfig.length > tokenId &&
            JSON.stringify(currentConfig[tokenId]) === JSON.stringify(tokenConfig[tokenId])
        ) {
            continue; // No changes needed
        }

        promises.push(
            evmAuthSigner.setMetadata(
                tokenId,
                tokenConfig[tokenId].active,
                tokenConfig[tokenId].burnable,
                tokenConfig[tokenId].transferable,
                tokenConfig[tokenId].price,
                tokenConfig[tokenId].ttl
            )
        );
    }

    await Promise.all(promises);
}
