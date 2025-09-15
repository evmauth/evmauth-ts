import evmAuth1155Json from './EVMAuth1155.json' with { type: 'json' };
import evmAuth6909Json from './EVMAuth6909.json' with { type: 'json' };

export const evmAuth1155Abi = [...evmAuth1155Json] as const;
export const evmAuth6909Abi = [...evmAuth6909Json] as const;
