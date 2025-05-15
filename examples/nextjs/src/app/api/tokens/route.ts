import { getTokenInfo } from '@/lib/evmauth/blockchain';
import { logger } from '@/lib/evmauth/logger';
import { TOKEN_METADATA, getTokenMetadata } from '@/lib/evmauth/token-utils';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

/**
 * GET /api/tokens - Get token information
 * @param req The request object
 * @returns Token information
 */
export async function GET(req: Request): Promise<NextResponse> {
    const operationId = nanoid();
    const url = new URL(req.url);
    const tokenId = url.searchParams.get('id');

    try {
        logger.info({
            category: 'api',
            message: 'Token information request',
            component: 'tokens-api',
            operationId,
            data: { tokenId },
        });

        // If token ID is provided, return specific token
        if (tokenId) {
            const id = Number.parseInt(tokenId);

            // Get token metadata
            const metadata = getTokenMetadata(id);

            if (!metadata) {
                logger.warn({
                    category: 'api',
                    message: `Token #${id} not found`,
                    component: 'tokens-api',
                    operationId,
                    data: { tokenId: id },
                });

                return NextResponse.json(
                    { error: true, message: `Token #${id} not found` },
                    { status: 404 }
                );
            }

            // Try to get on-chain info
            try {
                const onChainInfo = await getTokenInfo(id);

                // Merge metadata and on-chain info
                const fullMetadata = {
                    ...metadata,
                    ...onChainInfo,
                };

                logger.info({
                    category: 'api',
                    message: `Token #${id} info retrieved with on-chain data`,
                    component: 'tokens-api',
                    operationId,
                    data: { tokenId: id },
                });

                return NextResponse.json(fullMetadata);
            } catch (error) {
                // Return just the metadata if on-chain info fails
                logger.warn({
                    category: 'api',
                    message: `Failed to get on-chain data for token #${id}`,
                    component: 'tokens-api',
                    operationId,
                    data: { tokenId: id, error: (error as Error).message },
                });

                return NextResponse.json(metadata);
            }
        }

        // Return all tokens
        logger.info({
            category: 'api',
            message: 'All tokens info retrieved',
            component: 'tokens-api',
            operationId,
            data: { count: Object.keys(TOKEN_METADATA).length },
        });

        return NextResponse.json(Object.values(TOKEN_METADATA));
    } catch (error) {
        logger.error({
            category: 'api',
            message: 'Error getting token information',
            component: 'tokens-api',
            operationId,
            data: { error: (error as Error).message },
        });

        return NextResponse.json(
            { error: true, message: 'Error getting token information' },
            { status: 500 }
        );
    }
}
