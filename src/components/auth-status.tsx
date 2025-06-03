"use client";

import { useAuth } from "@clerk/nextjs";

export function AuthStatus() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
      <p>Signed in: {isSignedIn ? "Yes" : "No"}</p>
    </div>
  );
} 