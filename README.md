# EVMAuth TypeScript SDK

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/evmauth/evmauth-ts/test.yml?label=Tests)
![GitHub Repo stars](https://img.shields.io/github/stars/evmauth/evmauth-ts)

A TypeScript SDK for interacting with [EVMAuth contracts](https://github.com/evmauth/evmauth-core) deployed to Ethereum, Radius, and other EVM-compatible networks.

## Features

- Full TypeScript support with comprehensive type definitions
- Complete coverage of all EVMAuth contract functions
- Support for read and write operations
- Event handling with typed callbacks
- Works with any EVM-compatible network (Ethereum, Radius, etc.)
- Supports both providers and signers

## Installation

```bash
npm install evmauth ethers
```

## Quick Start

```typescript
import { ethers } from 'ethers';
import { EVMAuth } from 'evmauth';

// Replace with your EVMAuth contract address
const contractAddress = '0x1234567890abcdef1234567890abcdef12345678';

// Connect to an EVM network provider
const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');

// Create an SDK instance
const evmAuth = new EVMAuth(contractAddress, provider);

// Read token metadata
const tokenId = 1;
evmAuth.metadataOf(tokenId)
  .then(metadata => console.log('Token Metadata:', metadata))
  .catch(console.error);

// Connect with a signer for write operations
const privateKey = 'YOUR_PRIVATE_KEY';
const signer = new ethers.Wallet(privateKey, provider);
const evmAuthSigner = evmAuth.connect(signer);

// Purchase a token
evmAuthSigner.purchase('0xRECIPIENT', tokenId, 1, ethers.parseEther('0.1'))
  .then(tx => console.log('Transaction hash:', tx.hash))
  .catch(console.error);
```

## Core Functionality

### Initialization

```typescript
// With provider (read-only)
const provider = new ethers.JsonRpcProvider('https://rpc.example.com');
const evmAuth = new EVMAuth(contractAddress, provider);

// With signer (read & write)
const signer = new ethers.Wallet(privateKey, provider);
const evmAuthSigner = new EVMAuth(contractAddress, signer);

// Or connect a signer to an existing instance
const evmAuthSigner = evmAuth.connect(signer);
```

### Reading Token Data

```typescript
// Get token metadata
const metadata = await evmAuth.metadataOf(tokenId);
console.log(metadata);
// { id: 0n, active: true, burnable: true, transferable: false, price: 100000000000000000n, ttl: 2592000n }

// Check token status
const isActive = await evmAuth.active(tokenId);
const isBurnable = await evmAuth.burnable(tokenId);
const isTransferable = await evmAuth.transferable(tokenId);
const isForSale = await evmAuth.forSale(tokenId);

// Get token price and TTL
const price = await evmAuth.priceOf(tokenId);
const ttl = await evmAuth.ttlOf(tokenId);
const expiration = await evmAuth.expirationFor(tokenId);

// Get token balance
const balance = await evmAuth.balanceOf(accountAddress, tokenId);

// Get detailed balance including expiration
const balanceDetailsOf = await evmAuth.balanceDetailsOf(accountAddress, tokenId);
console.log(balanceDetailsOf);
// [{ balance: 1n, expiresAt: 1714583142n }]
```

### Token Operations

```typescript
// Mint tokens (requires TOKEN_MINTER_ROLE)
await evmAuth.issue(recipientAddress, tokenId, amount);

// Burn tokens (requires TOKEN_BURNER_ROLE)
await evmAuth.burn(accountAddress, tokenId, amount);

// Purchase tokens
await evmAuth.purchase(recipientAddress, tokenId, amount, price);

// Transfer tokens (if transferable)
await evmAuth.safeTransferFrom(fromAddress, toAddress, tokenId, amount);
```

### Role Management

```typescript
import { roles } from 'evmauth';

// Check roles
const hasMinterRole = await evmAuth.hasRole(roles.tokenMinter, accountAddress);

// Grant roles (requires admin role)
await evmAuth.grantRole(roles.tokenMinter, accountAddress);
await evmAuth.grantRoles([roles.tokenMinter, roles.tokenBurner], accountAddress);

// Revoke roles
await evmAuth.revokeRole(roles.tokenMinter, accountAddress);
await evmAuth.revokeRoles([roles.tokenMinter, roles.tokenBurner], accountAddress);
```

### Blacklist Management

```typescript
// Check if an account is blacklisted
const isBlacklisted = await evmAuth.isBlacklisted(accountAddress);

// Add to blacklist (requires BLACKLIST_MANAGER_ROLE)
await evmAuth.addToBlacklist(accountAddress);
await evmAuth.addBatchToBlacklist([address1, address2, address3]);

// Remove from blacklist
await evmAuth.removeFromBlacklist(accountAddress);
await evmAuth.removeBatchFromBlacklist([address1, address2, address3]);
```

### Event Handling

```typescript
// Listen for token transfers (ERC-1155 TransferSingle event)
const unsubscribe = evmAuth.onTransferSingle(
  (event) => {
    console.log('Transfer:', event);
  },
  fromFilter, // optional: filter by sender address (use zero address for token minting events)
  toFilter,   // optional: filter by receiver address (use zero address for token burning events)
);

// Listen for token purchases
const unsubscribe = evmAuth.onTokenPurchased(
  (event) => {
    console.log('Purchase:', event);
  },
  accountFilter, // optional: filter by purchaser wallet address
  tokenIdFilter, // optional: filter by token ID
);

// Stop listening
unsubscribe();
```

## Advanced Usage

### Admin Functions

```typescript
// Get contract owner
const owner = await evmAuth.owner();

// Transfer ownership (two-step process)
await evmAuth.beginDefaultAdminTransfer(newAdminAddress);
// Later, as the new admin:
await evmAuth.acceptDefaultAdminTransfer();

// Get/set wallet for receiving funds
const wallet = await evmAuth.wallet();
await evmAuth.setWallet(newWalletAddress);

// Withdraw funds accidentally sent to the contract address
await evmAuth.withdraw();
```

### Token Configuration

```typescript
// Update token metadata
await evmAuth.setMetadata(
  tokenId,
  true,  // active
  true,  // burnable
  false, // transferable
  ethers.parseEther('0.1'), // price
  60 * 60 * 24 * 30 // ttl: 30 days in seconds
);

// Update token price
await evmAuth.setPriceOf(tokenId, ethers.parseEther('0.2'));
await evmAuth.setPriceOfBatch([token1, token2], [price1, price2]);

// Update token TTL
await evmAuth.setTTL(tokenId, 60 * 60 * 24 * 7); // 7 days in seconds

// Update URI
await evmAuth.setURI('https://metadata.example.com/{id}.json');
```

## Error Handling

The SDK propagates errors from the underlying contract calls. Common errors include:

- `AccessControlUnauthorizedAccount`: The caller does not have the required role
- `ERC1155InsufficientBalance`: Insufficient balance for a transfer or burn operation
- `ERC1155InvalidReceiver`: The recipient cannot receive ERC1155 tokens

Example error handling:

```typescript
try {
  await evmAuth.issue(recipientAddress, tokenId, amount);
  console.log('Tokens minted successfully');
} catch (error) {
  if (error.message.includes('AccessControlUnauthorizedAccount')) {
    console.error('Error: You do not have the TOKEN_MINTER_ROLE');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## License

The **EVMAuth** TypeScript SDK is released under the MIT License. See the [LICENSE](LICENSE) file for details.
