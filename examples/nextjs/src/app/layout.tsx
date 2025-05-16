import "./globals.css";
import AuthProvider from "@/components/auth/auth-provider";
import HeaderNav from "@/components/auth/header-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EVMAuth Next.js Example",
  description:
    "Example Next.js application with EVMAuth middleware for token-based access control",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <header className="bg-slate-800 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">EVMAuth Next.js Example</h1>
              <HeaderNav />
            </div>
          </header>
          <main className="container mx-auto p-4">{children}</main>
          <footer className="bg-slate-800 text-white p-4 mt-8">
            <div className="container mx-auto text-center">
              <p suppressHydrationWarning>
                EVMAuth Next.js Example &copy; {new Date().getFullYear()}
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
