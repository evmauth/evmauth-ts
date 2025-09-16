import { defineChain } from 'viem';

export * from 'viem/chains';

export const radiusTestnet = defineChain({
    id: 1223953,
    name: 'Radius Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'US Dollar',
        symbol: 'USD',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.radiustech.xyz'],
            webSocket: [],
        },
    },
    blockExplorers: {
        default: {
            name: 'Radius Explorer',
            url: 'https://dashboard.radiustech.xyz/testnet/explorer',
        },
    },
});
