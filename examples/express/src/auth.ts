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
 * @param {TokenMetadata[]} settings - Array of token metadata objects.
 * @returns {Promise<void>}
 */
export async function setTokenMetadata(settings: TokenMetadata[]): Promise<void> {
    if (!evmAuthSigner) {
        console.warn('Signer is not initialized. Cannot set token metadata.');
        return;
    }

    const currentSettings: TokenMetadata[] = await auth.metadataOfAll();
    const promises: Promise<ethers.ContractTransactionResponse>[] = [];

    for (const token of settings) {
        const current: TokenMetadata | undefined = currentSettings.find((t: TokenMetadata) => t.id === token.id);
        if (
            current &&
            current.active === token.active &&
            current.burnable === token.burnable &&
            current.transferable === token.transferable &&
            current.price === token.price &&
            current.ttl === token.ttl
        ) {
            continue; // No changes needed
        }

        promises.push(
            evmAuthSigner.setMetadata(
                token.id,
                token.active,
                token.burnable,
                token.transferable,
                token.price,
                token.ttl
            )
        );
    }

    await Promise.all(promises);
}
