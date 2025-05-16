import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    TOKEN_METADATA,
    getAllTokenMetadata,
    getTokenAcquisitionSteps,
    getTokenMetadata,
    getTokenPurchaseOptions,
} from '../token-utils';

// Mock the config module
vi.mock('../config', () => ({
    ENV: {
        APP_URL: 'https://example.com',
    },
}));

describe('Token Utilities', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com');
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.unstubAllEnvs();
    });

    describe('getTokenMetadata', () => {
        it('should return metadata for a valid token ID', () => {
            const metadata = getTokenMetadata(0);
            expect(metadata).toBeDefined();
            expect(metadata?.id).toBe(0);
            expect(metadata?.name).toBe('Basic Access');
        });

        it('should return undefined for an invalid token ID', () => {
            const metadata = getTokenMetadata(999);
            expect(metadata).toBeUndefined();
        });
    });

    describe('getAllTokenMetadata', () => {
        it('should return all token metadata', () => {
            const allMetadata = getAllTokenMetadata();
            expect(allMetadata).toBeInstanceOf(Array);
            expect(allMetadata.length).toBe(Object.keys(TOKEN_METADATA).length);

            // Verify specific tokens are included
            expect(allMetadata.some((metadata) => metadata.id === 0)).toBe(true);
            expect(allMetadata.some((metadata) => metadata.id === 1)).toBe(true);
        });

        it('should return tokens with all required properties', () => {
            const allMetadata = getAllTokenMetadata();

            for (const metadata of allMetadata) {
                expect(metadata.id).toBeDefined();
                expect(metadata.name).toBeDefined();
                expect(metadata.description).toBeDefined();
                expect(metadata.fiatPrice).toBeDefined();
                expect(metadata.timeToLive).toBeDefined();
                expect(metadata.transferable).toBeDefined();
                expect(metadata.metered).toBeDefined();
                expect(metadata.burnedOnUse).toBeDefined();
            }
        });
    });

    describe('getTokenAcquisitionSteps', () => {
        it('should return default purchase steps for a token', () => {
            const steps = getTokenAcquisitionSteps(0);

            expect(steps).toBeInstanceOf(Array);
            expect(steps.length).toBe(2);
            expect(steps[0].action).toBe('authenticate');
            expect(steps[1].action).toBe('purchase');
        });

        it('should return renewal steps for an expired token', () => {
            const steps = getTokenAcquisitionSteps(0, 'TOKEN_EXPIRED');

            expect(steps).toBeInstanceOf(Array);
            expect(steps.length).toBe(2);
            expect(steps[0].action).toBe('authenticate');
            expect(steps[1].action).toBe('renew');
        });

        it('should return upgrade steps for insufficient token', () => {
            const steps = getTokenAcquisitionSteps(0, 'TOKEN_INSUFFICIENT');

            expect(steps).toBeInstanceOf(Array);
            expect(steps.length).toBe(2);
            expect(steps[0].action).toBe('authenticate');
            expect(steps[1].action).toBe('upgrade');
        });

        it('should return purchase steps for missing token', () => {
            const steps = getTokenAcquisitionSteps(0, 'TOKEN_MISSING');

            expect(steps).toBeInstanceOf(Array);
            expect(steps.length).toBe(2);
            expect(steps[0].action).toBe('authenticate');
            expect(steps[1].action).toBe('purchase');
        });

        it('should handle unknown tokens gracefully', () => {
            const steps = getTokenAcquisitionSteps(999);

            expect(steps).toBeInstanceOf(Array);
            expect(steps.length).toBe(2);
            expect(steps[0].action).toBe('authenticate');
            expect(steps[1].action).toBe('purchase');
            expect(steps[1].description).toContain('required token');
        });
    });

    describe('getTokenPurchaseOptions', () => {
        it('should return all purchase options for a valid token', () => {
            const options = getTokenPurchaseOptions(0);

            expect(options).toBeInstanceOf(Array);
            expect(options.length).toBe(3);

            // Verify specific options
            expect(options.some((option) => option.method === 'crypto')).toBe(true);
            expect(options.some((option) => option.method === 'fiat')).toBe(true);
            expect(options.some((option) => option.method === 'dapp')).toBe(true);
        });

        it('should return options with correct URLs', () => {
            const options = getTokenPurchaseOptions(0);

            const cryptoOption = options.find((option) => option.method === 'crypto');
            expect(cryptoOption?.url).toBe('https://example.com/purchase/0?method=crypto');

            const fiatOption = options.find((option) => option.method === 'fiat');
            expect(fiatOption?.url).toBe('https://example.com/purchase/0?method=fiat');

            const dappOption = options.find((option) => option.method === 'dapp');
            expect(dappOption?.url).toContain('https://marketplace.evmauth.dev/token/0');
            expect(dappOption?.url).toContain(encodeURIComponent('https://example.com'));
        });

        it('should return an empty array for invalid token ID', () => {
            const options = getTokenPurchaseOptions(999);

            expect(options).toBeInstanceOf(Array);
            expect(options.length).toBe(0);
        });
    });
});
