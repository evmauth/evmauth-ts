/**
 * Vitest setup file
 * Runs before all tests to configure the global test environment
 */

import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
        getAll: vi.fn(),
        has: vi.fn(),
        forEach: vi.fn(),
        entries: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        toString: vi.fn(),
    }),
    usePathname: () => '/',
}));

// Setup MSW server for API mocking
beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
    server.resetHandlers();
});

afterAll(() => {
    server.close();
});

// Mock global objects that might not be available in the test environment
global.crypto = {
    ...global.crypto,
    getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
        const bytes = new Uint8Array(array?.byteLength ?? 0);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
        if (array) {
            const typedArray = new Uint8Array(array.buffer);
            typedArray.set(bytes);
        }
        return array;
    },
    subtle: {
        ...global.crypto?.subtle,
        digest: vi.fn().mockImplementation(async () => {
            return new Uint8Array([1, 2, 3, 4, 5]);
        }),
    },
};
