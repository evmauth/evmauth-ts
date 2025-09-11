# EVMAuth TypeScript SDK

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/evmauth/evmauth-ts/test.yml?label=Tests)
![GitHub Repo stars](https://img.shields.io/github/stars/evmauth/evmauth-ts)

TypeScript types and helper functions for interacting with [EVMAuth contracts](https://github.com/evmauth/evmauth-core) on Ethereum and EVM-compatible networks. This SDK uses Viem for automatic type inference from contract ABIs, providing full type safety with minimal overhead.

## Features

- 🔒 **Full TypeScript Support** - Automatic type inference from contract ABIs via Viem
- 📦 **Two Token Standards** - Support for both ERC-1155 (EVMAuth1155) and ERC-6909 (EVMAuth6909) implementations
- 🚀 **Zero Overhead** - Direct contract access with minimal helper functions
- ⚡ **Tree-shakeable** - Import only what you need for smaller bundles
- 🛠️ **Developer Friendly** - IntelliSense support for all contract methods and events
- 🔄 **Type Safe** - Compile-time type checking for all contract interactions

## Installation

```bash
npm install evmauth viem
```

## Quick Start

```typescript
import { createWalletClient, createPublicClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { getEVMAuth1155, purchaseWithNative } from 'evmauth';

// Create clients
const publicClient = createPublicClient({
    chain: mainnet,
    transport: http('YOUR_RPC_URL'),
});

const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http('YOUR_RPC_URL'),
});

// For EVMAuth1155 contracts
const contract = getEVMAuth1155('0xContractAddress' as Address, walletClient);

// Read token price
const tokenId = 1n;
const price = await contract.read.tokenPrice([tokenId]);

// Purchase tokens with helper function
await purchaseWithNative(contract, tokenId, 5n); // Buy 5 tokens

// Or use contract directly
const totalCost = price * 5n;
await contract.write.purchase([tokenId, 5n], { value: totalCost });

// Check balance
const balance = await contract.read.balanceOf([account.address, tokenId]);
console.log(`Balance: ${balance}`);
```

## Usage

### Connecting to Contracts

```typescript
import { createWalletClient, createPublicClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { getEVMAuth1155, getEVMAuth6909 } from 'evmauth';

// Setup clients
const publicClient = createPublicClient({
    chain: mainnet,
    transport: http('https://your-rpc-url'),
});

const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http('https://your-rpc-url'),
});

// Connect to EVMAuth1155 contract
const contract1155 = getEVMAuth1155('0xAddress' as Address, walletClient);

// Connect to EVMAuth6909 contract  
const contract6909 = getEVMAuth6909('0xAddress' as Address, walletClient);

// Read-only connection (use publicClient)
const readOnly = getEVMAuth1155('0xAddress' as Address, publicClient);
```

### Creating and Configuring Tokens

```typescript
import { parseEther } from 'viem';
import { getTokenIdFromCreation } from 'evmauth';
import type { EVMAuthTokenConfig } from 'evmauth';

// Define token configuration
const tokenConfig: EVMAuthTokenConfig = {
    price: parseEther('0.1'),              // 0.1 ETH per token
    erc20Prices: [],                       // No ERC20 payment options
    ttl: BigInt(30 * 24 * 60 * 60),       // 30 days in seconds
    transferable: true                     // Can be transferred
};

// Create a new token
const hash = await contract.write.createToken([tokenConfig]);
const receipt = await publicClient.waitForTransactionReceipt({ hash });

// Extract the token ID from the creation event
const tokenId = getTokenIdFromCreation(receipt);
console.log('Created token:', tokenId);

// Update token configuration (requires TOKEN_MANAGER_ROLE)
const newConfig: EVMAuthTokenConfig = {
    price: parseEther('0.2'),
    erc20Prices: [],
    ttl: BigInt(60 * 24 * 60 * 60),
    transferable: false
};
await contract.write.updateToken([tokenId, newConfig]);
```

### Purchasing Tokens

```typescript
import { 
    purchaseWithNative, 
    purchaseForWithNative,
    canPurchaseWithERC20 
} from 'evmauth';

// Purchase with native currency (ETH, etc.)
await purchaseWithNative(contract, tokenId, 5n); // Buy 5 tokens

// Purchase for another address
await purchaseForWithNative(contract, '0xRecipient' as Address, tokenId, 3n);

// Check if ERC20 payment is accepted
const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address;
if (await canPurchaseWithERC20(contract, tokenId, usdcAddress)) {
    // First approve the USDC spending
    // const usdcContract = getContract({ address: usdcAddress, abi: erc20Abi, client: walletClient });
    // await usdcContract.write.approve([contract.address, requiredAmount]);
    
    // Then purchase with ERC20
    await contract.write.purchaseWithERC20([usdcAddress, tokenId, 5n]);
}
```

### Checking Balances

```typescript
import { hasActiveBalance } from 'evmauth';

// Get raw balance
const balance = await contract.read.balanceOf([userAddress, tokenId]);

// Check if user has minimum required balance
const hasEnough = await hasActiveBalance(contract, userAddress, tokenId, 1n);

// Get detailed balance records with expiration times
const records = await contract.read.balanceRecordsOf([userAddress, tokenId]);
for (const record of records) {
    console.log(`Amount: ${record.amount}`);
    console.log(`Expires: ${new Date(Number(record.expiresAt) * 1000)}`);
}
```

### Role Management

```typescript
import { ROLES } from 'evmauth';

// Check if address has a role
const minterRole = await contract.read.MINTER_ROLE();
const isMinter = await contract.read.hasRole([minterRole, userAddress]);

// Grant a role (requires DEFAULT_ADMIN_ROLE)
const tokenManagerRole = await contract.read.TOKEN_MANAGER_ROLE();
await contract.write.grantRole([tokenManagerRole, managerAddress]);

// Revoke a role
await contract.write.revokeRole([minterRole, userAddress]);

// Using the ROLES helper constant
console.log('Available roles:', ROLES);
// { DEFAULT_ADMIN, MINTER, BURNER, TOKEN_MANAGER, ... }
```

### Token Operations

```typescript
// Mint tokens (requires MINTER_ROLE)
await contract.write.mint([recipientAddress, tokenId, 100n, '0x']);

// Burn tokens (requires BURNER_ROLE)
await contract.write.burn([holderAddress, tokenId, 50n]);

// Transfer tokens (if transferable)
await contract.write.safeTransferFrom([
    fromAddress,
    toAddress,
    tokenId,
    amount,
    '0x' // optional data
]);

// Batch transfer (ERC1155 only)
await contract1155.write.safeBatchTransferFrom([
    fromAddress,
    toAddress,
    [tokenId1, tokenId2],
    [amount1, amount2],
    '0x'
]);
```

### Event Listening

```typescript
import { parseAbiItem } from 'viem';

// Watch for token purchases
const unwatch = publicClient.watchContractEvent({
    address: contract.address,
    abi: contract.abi,
    eventName: 'TokenPurchased',
    onLogs: (logs) => {
        for (const log of logs) {
            console.log(`Token ${log.args.id} purchased`);
            console.log(`Amount: ${log.args.amount}, Price: ${log.args.price}`);
        }
    },
});

// Get past events
const events = await publicClient.getContractEvents({
    address: contract.address,
    abi: contract.abi,
    eventName: 'TokenPurchased',
    fromBlock: 'earliest',
    toBlock: 'latest',
});

// Filter events for specific user
const userEvents = await publicClient.getContractEvents({
    address: contract.address,
    abi: contract.abi,
    eventName: 'TokenPurchased',
    args: { receiver: userAddress },
    fromBlock: 'earliest',
    toBlock: 'latest',
});
```

## ERC-1155 vs ERC-6909

This SDK supports both token standards:

### ERC-1155 (EVMAuth1155)
```typescript
// Batch operations
const balances = await contract1155.read.balanceOfBatch([
    [address1, address2],
    [tokenId1, tokenId2]
]);

// Set approval for all tokens
await contract1155.write.setApprovalForAll([operatorAddress, true]);

// URI for metadata
const uri = await contract1155.read.uri([tokenId]);
```

### ERC-6909 (EVMAuth6909)
```typescript
// Token-specific approvals
await contract6909.write.approve([spenderAddress, tokenId, amount]);

// Check allowance
const allowance = await contract6909.read.allowance([
    ownerAddress,
    spenderAddress,
    tokenId
]);

// Transfer with allowance
await contract6909.write.transferFrom([
    fromAddress,
    toAddress,
    tokenId,
    amount
]);

// Token metadata
const name = await contract6909.read.name([tokenId]);
const symbol = await contract6909.read.symbol([tokenId]);
const decimals = await contract6909.read.decimals([tokenId]);
```

## Viem Benefits

This SDK uses Viem for type-safe contract interactions:

- **Type Safety**: Automatic type inference from contract ABIs
- **IntelliSense**: Auto-completion for all contract functions and parameters
- **Runtime Safety**: Built-in validation and error handling
- **Tree Shaking**: Import only what you use for smaller bundles
- **Direct Access**: Use contracts directly with minimal overhead
- **Modern Stack**: Built on the latest Web3 standards

## Error Handling

```typescript
import { ContractFunctionRevertedError } from 'viem';

try {
    await purchaseWithNative(contract, tokenId, 10n);
} catch (error) {
    if (error instanceof ContractFunctionRevertedError) {
        const revertError = error.data?.errorName;
        if (revertError === 'InsufficientBalance') {
            console.error('Not enough ETH to purchase tokens');
        } else if (revertError === 'Pausable__Paused') {
            console.error('Contract is currently paused');
        } else if (revertError === 'AccountFrozen') {
            console.error('Your account has been frozen');
        } else {
            console.error('Transaction failed:', revertError);
        }
    } else {
        console.error('Transaction failed:', error);
    }
}
```

## Migration from Ethers.js/TypeChain

If you were using ethers.js or TypeChain:

```typescript
// Old way (ethers.js/TypeChain)
import { ethers } from 'ethers';
import { EVMAuth1155__factory } from './typechain';
const provider = new ethers.JsonRpcProvider(url);
const signer = new ethers.Wallet(key, provider);
const contract = EVMAuth1155__factory.connect(address, signer);
await contract.purchase(tokenId, amount, { value });

// New way (Viem)
import { createWalletClient, http } from 'viem';
import { getEVMAuth1155 } from 'evmauth';
const walletClient = createWalletClient({ chain, transport: http(url) });
const contract = getEVMAuth1155(address, walletClient);
await contract.write.purchase([tokenId, amount], { value });
```

Key differences:
- Use Viem clients instead of ethers providers/signers
- Contract methods are under `.read` and `.write` namespaces
- Arguments are passed as arrays
- All numeric values use `bigint` (add `n` suffix to literals)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

The **EVMAuth** TypeScript SDK is released under the MIT License. See the [LICENSE](LICENSE) file for details.
