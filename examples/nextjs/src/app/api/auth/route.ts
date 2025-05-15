import { authenticateUser, generateChallenge } from '@/lib/evmauth/auth';
import type { AuthResult, ChallengeResult } from '@/types/evmauth';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth - Get a challenge for authentication
 * @returns A challenge message to sign
 */
export async function GET(): Promise<NextResponse> {
    try {
        // Generate a challenge
        const challenge = generateChallenge();

        // Return the challenge
        return NextResponse.json(challenge);
    } catch (error) {
        console.error('Error generating challenge:', error);

        // Return error response
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate challenge',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/auth - Complete authentication with signature
 * @param req The request object
 * @returns Authentication result with JWT token if successful
 */
export async function POST(req: Request): Promise<NextResponse> {
    try {
        // Parse request body
        const body = await req.json();

        // Check required fields
        if (!body.signature || !body.nonce) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields',
                    errorCode: 'INVALID_REQUEST',
                },
                { status: 400 }
            );
        }

        // Authenticate user
        const authResult = await authenticateUser(body.nonce, body.signature);

        // If authentication failed, return error
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 });
        }

        // Create response with auth token cookie
        const response = NextResponse.json(authResult);

        // Set auth token cookie for both production and development
        // This ensures the token is stored in cookies for middleware to access
        response.cookies.set({
            name: 'evmauth_token',
            value: authResult.token ?? '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only require secure in production
            sameSite: 'lax', // Use 'lax' to support redirects
            path: '/',
            maxAge: 60 * 60, // 1 hour
        });

        return response;
    } catch (error) {
        console.error('Authentication error:', error);

        // Return error response
        return NextResponse.json(
            {
                success: false,
                error: 'Authentication failed',
                errorCode: 'SERVER_ERROR',
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/auth - Log out by clearing auth token
 * @returns Success response
 */
export async function DELETE(): Promise<NextResponse> {
    // Create response
    const response = NextResponse.json({
        success: true,
    });

    // Clear auth token cookie
    response.cookies.set({
        name: 'evmauth_token',
        value: '',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 0, // Expire immediately
    });

    return response;
}
