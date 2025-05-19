import express from 'express';
import type { Express, Request, Response } from 'express';
import { setTokenMetadata } from './auth.js';
import { port } from './config.js';
import { paymentRequired } from './middleware.js';

const app: Express = express();

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'This is a public route; no authorization required.',
    });
});

const tokenId = 0;
const amount = 1;

app.get('/paid-content', paymentRequired(tokenId, amount), (_req: Request, res: Response) => {
    res.json({
        message: `Paid Content: You should only see this if you purchased token ID ${tokenId} x ${amount}.`,
    });
});

const tokenIdX402 = 1;
const amountX402 = 1;

app.get(
    '/paid-content-x402',
    paymentRequired(tokenIdX402, amountX402, {
        price: '$0.10',
        network: 'base-sepolia',
        config: {
            description: `EVMAuth token (id: ${tokenIdX402} amount: ${amountX402}) required`,
        },
    }),
    (_req: Request, res: Response) => {
        res.json({
            message: `Paid Content: You should only see this if you purchased ${amountX402} token ID ${tokenIdX402}.`,
        });
    }
);

app.listen(port, async () => {
    await setTokenMetadata([
        {
            id: BigInt(0),
            active: true,
            burnable: true,
            transferable: true,
            price: BigInt(1_000_000_000), // Sold for ETH directly via the contract.
            ttl: BigInt(3600),
        },
        {
            id: BigInt(1),
            active: true,
            burnable: true,
            transferable: true,
            price: BigInt(0), // Sold for USDC via x402 middleware; not purchasable via the contract.
            ttl: BigInt(3600),
        },
    ]);

    console.log(`Server is running on port ${port}`);
});
