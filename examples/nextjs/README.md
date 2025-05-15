# EVMAuth Next.js Example

This example demonstrates integrating EVMAuth with a Next.js application for token-based access control using the App Router architecture.

## Local Development Setup

1. Clone this repository
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy `.env.example` to `.env.local` and configure:

   ```bash
   # Required environment variables
   EVMAUTH_RPC_URL=           # Blockchain RPC URL
   EVMAUTH_CONTRACT_ADDRESS=  # Deployed EVMAuth contract address
   JWT_SECRET=                # Secret for signing JWTs (min 32 chars)
   
   # Demo wallet for local development only (never use in production)
   # Use a burner wallet with no real funds!
   EVMAUTH_DEMO_PRIVATE_KEY=  # Private key for demo wallet
   EVMAUTH_DEMO_WALLET_ADDRESS= # Public address of the demo wallet
   ```

   ### Environment Variable Setup Guide

   #### Contract Address

   To get `EVMAUTH_CONTRACT_ADDRESS`:
   - Clone the [evmauth-core repository](https://github.com/evmauth/evmauth-core)
   - Follow the README instructions to deploy an EVMAuth smart contract
   - Use the deployed contract address

   #### RPC URL

   To get `EVMAUTH_RPC_URL`:
   - Get the RPC URL for the EVM-compatible network where you deployed the contract
   - For Radius Testnet, [generate an RPC URL here](https://testnet.tryradi.us/dashboard/rpc-endpoints)

   #### Demo Wallet

   For the demo wallet credentials:
   1. Generate a new wallet using [MetaMask](https://metamask.io/) or similar tool
   2. Copy the private key to `EVMAUTH_DEMO_PRIVATE_KEY`
   3. Copy the wallet address to `EVMAUTH_DEMO_WALLET_ADDRESS`
   4. ⚠️ **IMPORTANT:** Never use a wallet with real funds for development!

   #### Seeding Test Funds

   For testing token purchases:
   - If using Radius Testnet, [seed your wallet with testnet tokens here](https://testnet.tryradi.us/dashboard/faucet)
   - For other networks, use the appropriate testnet faucet

4. Run the development server:

   ```bash
   pnpm dev
   ```

## How It Works

This example implements token-gated authentication and access control:

1. **Next.js Middleware**: Intercepts requests to protected routes
2. **JWT Authentication**: Securely verifies user identity
3. **Token Validation**: Checks token ownership on the blockchain
4. **Route Protection**: Different routes can require different tokens

## Authentication Flow

1. User visits a protected route and is redirected to login
2. In demo mode, server authenticates using pre-configured wallet
3. JWT is issued and stored in HTTP-only cookies
4. Middleware validates tokens and enforces access rules
5. Token validation occurs against the live blockchain contract

## Demo Mode

This example uses a **demo mode** for easy testing:

- Uses a pre-configured wallet from environment variables
- Server-side authentication without requiring real wallet connections
- Simplified token purchase flow for demonstration

⚠️ **IMPORTANT:** Never use real private keys with actual funds. This approach is for demonstration only.

## Key Features

- **Next.js App Router Integration**: Modern routing architecture
- **Middleware Protection**: Route-based access control
- **Token Requirements**: Different routes can require specific tokens
- **Token Purchase**: Demo token acquisition flow
- **JWT Session Management**: Secure authentication
- **Error Handling**: Consistent error responses and redirects

## Directory Structure

- `src/app` - Next.js App Router pages and API routes
  - `api/auth/` - Authentication endpoints
  - `api/protected/` - Protected API endpoints
  - `api/tokens/` - Token management endpoints
  - `login/` - Login page
  - `protected/` - Protected pages
- `src/components` - React components
- `src/lib/evmauth` - EVMAuth integration
  - `auth.ts` - Authentication utilities
  - `blockchain.ts` - Blockchain service
  - `config.ts` - Configuration and route protection rules
  - `middleware-helpers.ts` - Middleware utilities
  - `token-utils.ts` - Token management
- `src/middleware.ts` - Next.js middleware for route protection

## Middleware Implementation

The application's middleware (`src/middleware.ts`):

- Intercepts requests to protected routes
- Validates authentication tokens from cookies
- Checks token requirements against blockchain
- Redirects unauthenticated users to login
- Adds wallet address to headers for downstream use

## Token Requirements

Protected routes can specify token requirements:

- `/protected` - Requires token #0
- `/protected/premium` - Requires token #1
- Requirements defined in `src/lib/evmauth/config.ts`

## Production Considerations

For production use, replace the demo wallet approach with:

1. Proper wallet connection (MetaMask, WalletConnect, etc.)
2. Client-side transaction signing
3. Secure token management
4. Additional security measures

## Testing

Run tests with:

```bash
pnpm test
```

Watch mode:

```bash
pnpm test:watch
```

## License

MIT
