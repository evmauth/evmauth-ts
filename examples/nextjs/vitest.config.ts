import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        include: ['**/__tests__/**/*.test.{ts,tsx}'],
        globals: true,
        setupFiles: ['./src/lib/evmauth/__tests__/test-setup.ts'],
        environmentOptions: {
            env: {
                NEXT_PUBLIC_EVMAUTH_RPC_URL: 'https://eth-sepolia.example.com',
                NEXT_PUBLIC_EVMAUTH_CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
                JWT_SECRET: 'this-is-a-test-secret-that-is-at-least-32-characters-long',
                AUTH_TOKEN_EXPIRY: '3600',
                AUTH_CHALLENGE_EXPIRY: '300',
                NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            'evmauth': resolve(__dirname, '../../src/index.ts'),
        },
    },
});
