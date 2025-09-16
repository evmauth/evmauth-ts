import jsonEVMAuth1155 from './EVMAuth1155.json' with { type: 'json' };
import jsonEVMAuth6909 from './EVMAuth6909.json' with { type: 'json' };

export const abiEVMAuth1155 = [...jsonEVMAuth1155] as const;
export const abiEVMAuth6909 = [...jsonEVMAuth6909] as const;
