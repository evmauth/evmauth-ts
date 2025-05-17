import { vi } from 'vitest';

// Set environment variables needed for tests
process.env.NEXT_PUBLIC_EVMAUTH_RPC_URL = 'https://eth-sepolia.example.com';
process.env.NEXT_PUBLIC_EVMAUTH_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
process.env.JWT_SECRET = 'this-is-a-test-secret-that-is-at-least-32-characters-long';
process.env.AUTH_TOKEN_EXPIRY = '3600';
process.env.AUTH_CHALLENGE_EXPIRY = '300';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
