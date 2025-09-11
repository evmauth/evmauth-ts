// Export ABIs
export { evmAuth1155Abi, evmAuth6909Abi } from './abis/index.js';

// Export helper functions
export {
    purchaseWithNative,
    purchaseForWithNative,
    getTokenIdFromCreation,
    hasActiveBalance,
    canPurchaseWithERC20,
    getEVMAuth1155,
    getEVMAuth6909,
    ROLES,
    type EVMAuthContract,
} from './helpers.js';

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
