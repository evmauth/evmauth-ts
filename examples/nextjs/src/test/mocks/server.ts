import { setupServer } from 'msw/node';
import { authHandlers } from './auth-mocks';
import { blockchainHandlers } from './blockchain-mocks';

// Create mock server with all handlers
export const server = setupServer(...authHandlers, ...blockchainHandlers);
