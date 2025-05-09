# Using EVMAuth with Express.js

This example demonstrates how to use EVMAuth with [Express.js](https://expressjs.com/en/5x/api.html). It includes a
simple REST API server with two endpoints:

- GET `http://localhost:3000/`: A public endpoint that requires no authorization.
- GET `http://localhost:3000/paid-content`: A protected endpoint that requires the purchase of token ID `0`.

## Prerequisites

Before running this example code, you will need to deploy the EVMAuth contract to a testnet or local Ethereum node;
see [EVMAuth Core](https://github.com/evmauth/evmauth-core?tab=readme-ov-file#quick-start) for instructions.

You will also need:
- [Node.js](https://nodejs.org/en/download/)
- [PNPM](https://pnpm.io/installation)

## Setup

1. Copy `.env.example` to `.env` and set environment variables:
```sh
cp .env.example .env
```

2. Install dependencies:
```sh
pnpm install
```

3. Compile the TypeScript code:
```sh
pnpm build
```

4. Start the Express server:
```sh
pnpm start
```

5. Test the endpoints:
```sh
curl -X GET http://localhost:3000/
curl -X GET http://localhost:3000/paid-content
curl -X GET http://localhost:3000/paid-content?address=0x...
```

Replace `0x...` with the address of the user you want to check for authorization. If that address owns token ID `0`,
you should see:

```json
{
  "message": "This is a paid content route; you should only see this if you purchased the required token."
}
```

Note that, for demonstration purposes, we are passing the user's wallet address as a URL query parameter here.
In a real-world application, you would authenticate the user to verify they own the wallet address, using
[EIP-712] message signing, then issue a JWT or session cookie containing the wallet address.


[EIP-712]: https://eips.ethereum.org/EIPS/eip-712
