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

const tokenId: number = 0;
const tokenAmount: number = 1;

app.get('/paid-content', paymentRequired(tokenId, tokenAmount), (_req: Request, res: Response) => {
    res.json({
        message:
            'This is a paid content route; you should only see this if you purchased the required token.',
    });
});

app.listen(port, async () => {
    await setTokenMetadata([
        {
            id: BigInt(0),
            active: true,
            burnable: true,
            transferable: true,
            price: BigInt(1_000_000_000),
            ttl: BigInt(3600),
        },
    ]);

    console.log(`Server is running on port ${port}`);
});
