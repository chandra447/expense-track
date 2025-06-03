"use client";

import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from '@clerk/nextjs';
import { Provider as JotaiProvider } from 'jotai';
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth-provider";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <html lang="en" className="dark">
        <body>
          <JotaiProvider>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <Navbar />
                {children}
              </AuthProvider>
            </QueryClientProvider>
          </JotaiProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
