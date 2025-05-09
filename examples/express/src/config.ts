import 'dotenv/config';

export const contractAddress: string =
    process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
export const networkId: number = Number(process.env.NETWORK_ID) || 1223953; // Radius Testnet
export const port: number = Number(process.env.PORT) || 3000;
export const rpcUrl = process.env.RPC_URL || 'https://rpc.testnet.tryradi.us';
export const privateKey = process.env.TOKEN_MANAGER_PRIVATE_KEY || '';
