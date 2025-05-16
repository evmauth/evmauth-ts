import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'EVMAuth Next.js Example',
    description: 'Example Next.js application using EVMAuth for token-gated content',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <main>{children}</main>
            </body>
        </html>
    );
}
