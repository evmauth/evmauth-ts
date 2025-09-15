// Export ABIs
export { evmAuth1155Abi, evmAuth6909Abi } from './abis/index.js';

// Export SDK modules
export {
    // Base SDK and types
    BaseSDK,
    type EVMAuth1155Contract,
    type EVMAuth6909Contract,
    // SDK Classes
    AdminSDK,
    AccessManagerSDK,
    TokenManagerSDK,
    MinterSDK,
    BurnerSDK,
    TreasurerSDK,
    ClientSDK,
    // Factory functions for EVMAuth1155
    createAdminSDK1155,
    createAccessManagerSDK1155,
    createTokenManagerSDK1155,
    createMinterSDK1155,
    createBurnerSDK1155,
    createTreasurerSDK1155,
    createClientSDK1155,
    // Factory functions for EVMAuth6909
    createAdminSDK6909,
    createAccessManagerSDK6909,
    createTokenManagerSDK6909,
    createMinterSDK6909,
    createBurnerSDK6909,
    createTreasurerSDK6909,
    createClientSDK6909,
    // Types from SDK modules
    type TokenConfig,
    type CreateTokenParams,
    type UpdateTokenParams,
    type MintParams,
    type MintBatchParams,
    type BurnParams,
    type BurnBatchParams,
    type TransferParams,
    type BatchTransferParams,
    // Contract getters and constants
    getEVMAuth1155,
    getEVMAuth6909,
    ROLES,
    type EVMAuthContract,
} from './sdk/index.js';

// Export custom types
export type {
    EVMAuthRole,
    EVMAuthToken,
    EVMAuthTokenConfig,
    BalanceRecord,
    Signer,
} from './types.js';

// Re-export commonly used viem utilities
export {
    createPublicClient,
    createWalletClient,
    getContract,
    parseEther,
    formatEther,
    parseUnits,
    formatUnits,
    http,
    custom,
    type Address,
    type Hash,
    type PublicClient,
    type WalletClient,
    type GetContractReturnType,
} from 'viem';

// Re-export common chains
export {
    mainnet,
    sepolia,
    polygon,
    arbitrum,
    optimism,
    base,
} from 'viem/chains';

// Export the raw ABIs as JSON for those who need them
export { default as EVMAuth1155_ABI } from './abis/EVMAuth1155.json' with { type: 'json' };
export { default as EVMAuth6909_ABI } from './abis/EVMAuth6909.json' with { type: 'json' };
