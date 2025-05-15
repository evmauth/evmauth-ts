import Link from 'next/link';

export default function Home() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Welcome to EVMAuth Next.js Example</h1>

            <div className="card">
                <h2 className="text-2xl font-semibold mb-4">Token-Based Access Control</h2>
                <p className="mb-4">
                    This example demonstrates how to implement token-based access control in a
                    Next.js application using the EVMAuth middleware. The middleware verifies that
                    users own the required tokens before allowing access to protected resources.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded">
                        <h3 className="text-xl font-semibold mb-2">Basic Access</h3>
                        <p className="mb-4">Requires Token #0</p>
                        <Link href="/protected" className="btn btn-primary inline-block">
                            Try Basic Access
                        </Link>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded">
                        <h3 className="text-xl font-semibold mb-2">Premium Access</h3>
                        <p className="mb-4">Requires Token #1</p>
                        <Link href="/protected/premium" className="btn btn-primary inline-block">
                            Try Premium Access
                        </Link>
                    </div>
                </div>
            </div>

            <div className="card mt-6">
                <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
                <ol className="list-decimal ml-6 space-y-2">
                    <li>The middleware intercepts requests to protected routes</li>
                    <li>It checks for a valid JWT token in cookies or headers</li>
                    <li>If the token is valid, it verifies the user's token ownership</li>
                    <li>If the user has the required tokens, access is granted</li>
                    <li>If not, the user is redirected to the token requirement page</li>
                </ol>
            </div>

            <div className="card mt-6">
                <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
                <p className="mb-4">
                    The API endpoints are also protected by the middleware. Try accessing:
                </p>
                <ul className="list-disc ml-6 space-y-2">
                    <li>
                        <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                            /api/protected
                        </code>{' '}
                        - Requires Token #0
                    </li>
                    <li>
                        <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                            /api/protected/premium
                        </code>{' '}
                        - Requires Token #1
                    </li>
                </ul>
            </div>
        </div>
    );
}
