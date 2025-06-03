"use client";

import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from '@clerk/nextjs';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/react/utils';
import { queryClientAtom } from 'jotai-tanstack-query';
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/components/auth-provider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const HydrateAtoms = ({ children }: { children: React.ReactNode }) => {
  useHydrateAtoms(new Map([[queryClientAtom, queryClient]]));
  return children;
};

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
          <QueryClientProvider client={queryClient}>
            <JotaiProvider>
              <HydrateAtoms>
                <AuthProvider>
                  <Navbar />
                  {children}
                </AuthProvider>
              </HydrateAtoms>
            </JotaiProvider>
          </QueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
