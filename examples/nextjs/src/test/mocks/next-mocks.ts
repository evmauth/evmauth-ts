import { vi } from 'vitest';

/**
 * Mock implementation of Next.js utilities and middleware
 */
export const mockNextUtils = {
    NextResponse: {
        next: vi.fn(),
        redirect: vi.fn(),
        json: vi.fn(),
    },
};

/**
 * Create a mock Next.js request
 */
export function createMockRequest(options: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
}): Request {
    const { url, method = 'GET', headers = {} } = options;

    return new Request(url, {
        method,
        headers: new Headers(headers),
    });
}

/**
 * Setup Next.js mocks with default behavior
 */
export function setupNextMocks() {
    // Mock NextResponse.next
    mockNextUtils.NextResponse.next.mockImplementation(() => {
        return new Response(null, { status: 200 });
    });

    // Mock NextResponse.redirect
    mockNextUtils.NextResponse.redirect.mockImplementation((url: string) => {
        return new Response(null, {
            status: 302,
            headers: {
                Location: url,
            },
        });
    });

    // Mock NextResponse.json
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    mockNextUtils.NextResponse.json.mockImplementation((data: any, init?: ResponseInit) => {
        return new Response(JSON.stringify(data), {
            status: init?.status || 200,
            headers: {
                'Content-Type': 'application/json',
                ...(init?.headers || {}),
            },
        });
    });

    return {
        reset: () => {
            vi.resetAllMocks();
            setupNextMocks();
        },
    };
}
