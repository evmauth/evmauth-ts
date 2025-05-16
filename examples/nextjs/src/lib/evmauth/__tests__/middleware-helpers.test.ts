import { describe, expect, it, vi } from 'vitest';
import {
    getTokenRequirementForPath,
    isProtectedPath,
    isStaticPath,
    extractWalletAddress,
} from '../middleware-helpers';

describe('Middleware Helpers', () => {
    describe('getTokenRequirementForPath', () => {
        it('should return token ID 1 for premium paths', () => {
            const result = getTokenRequirementForPath('/api/protected/premium');
            expect(result.tokenId).toBe(1);
            expect(result.amount).toBe(1);
        });

        it('should return token ID 0 for non-premium paths', () => {
            const result = getTokenRequirementForPath('/api/protected');
            expect(result.tokenId).toBe(0);
            expect(result.amount).toBe(1);
        });
    });

    describe('isProtectedPath', () => {
        it('should identify protected paths', () => {
            expect(isProtectedPath('/api/protected')).toBe(true);
            expect(isProtectedPath('/api/protected/premium')).toBe(true);
        });

        it('should identify non-protected paths', () => {
            expect(isProtectedPath('/api/public')).toBe(false);
            expect(isProtectedPath('/home')).toBe(false);
        });
    });

    describe('isStaticPath', () => {
        it('should identify static paths', () => {
            expect(isStaticPath('/_next/static/file.js')).toBe(true);
            expect(isStaticPath('/favicon.ico')).toBe(true);
            expect(isStaticPath('/robots.txt')).toBe(true);
            expect(isStaticPath('/public/image.png')).toBe(true);
        });

        it('should identify non-static paths', () => {
            expect(isStaticPath('/api/protected')).toBe(false);
            expect(isStaticPath('/home')).toBe(false);
        });
    });

    describe('extractWalletAddress', () => {
        it('should extract wallet address from query parameters', () => {
            const req = new Request('https://example.com/api/protected?address=0x123456789');
            const result = extractWalletAddress(req);
            expect(result).toBe('0x123456789');
        });

        it('should return null if wallet address is not provided', () => {
            const req = new Request('https://example.com/api/protected');
            const result = extractWalletAddress(req);
            expect(result).toBeNull();
        });
    });
});