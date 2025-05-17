# EVMAuth Next.js Example

This example demonstrates how to use EVMAuth for token-gated content in a Next.js application.

## Overview

This example shows:

- How to implement token-gated access control in a Next.js application
- How to use Next.js middleware to verify token ownership
- How to access protected content from client components

## Key Features

- **Token Validation Middleware**: Simple Next.js middleware that verifies token ownership
- **Protected API Routes**: API routes that require token ownership to access
- **Client-Side Demo**: Demo page showing how to access token-gated content

## Important Note

This example focuses solely on token validation for simplicity. In a production application, you would:

1. Implement proper wallet authentication using signatures to verify wallet ownership
2. Use a secure session management system
3. Implement more robust error handling and retry logic

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm (or npm/yarn)
- Access to an EVMAuth contract (on Radius Testnet or any other network)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/evmauth.git
   cd evmauth/examples/nextjs
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables:
   - Create a `.env.local` file based on `.env.example`
   - Set your contract address and RPC URL

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/middleware.ts` - Token validation middleware
- `/src/app/api/protected/*` - Protected API routes that require token ownership
- `/src/app/page.tsx` - Demo page showing how to access protected content
- `/src/lib/evmauth/*` - Utilities for token validation

## How It Works

1. The middleware intercepts requests to protected routes
2. It checks if the wallet address has the required token balance
3. If the token balance is sufficient, the request proceeds to the handler
4. If the token balance is insufficient, a 402 Payment Required response is returned

## Usage Example

```tsx
// Client-side example of accessing protected content
async function fetchProtectedContent(walletAddress) {
  const response = await fetch(`/api/protected?address=${walletAddress}`);
  
  if (response.status === 402) {
    // Token purchase required
    const paymentDetails = await response.json();
    // Show payment UI...
    return;
  }
  
  if (!response.ok) {
    // Handle other errors
    return;
  }
  
  // Success - protected content accessible
  const data = await response.json();
  // Show protected content...
}
```

## License

MIT
