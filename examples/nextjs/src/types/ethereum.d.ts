// Ethereum provider type definitions

declare global {
    interface Window {
        ethereum?: {
            isMetaMask?: boolean;
            // biome-ignore lint/suspicious/noExplicitAny: We need to accept any type for params
            request: (request: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, callback: (accounts: string[]) => void) => void;
            removeListener: (event: string, callback: (accounts: string[]) => void) => void;
        };
    }
}

export {};
