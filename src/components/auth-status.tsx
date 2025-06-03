"use client";

import { useAuthState, useUserDisplayName, useUserId } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function AuthStatus() {
  const authState = useAuthState();
  const displayName = useUserDisplayName();
  const userId = useUserId();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Authentication Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status:</span>
          <div className="flex items-center gap-2">
            {!authState.isLoaded ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <Badge variant="secondary">Loading...</Badge>
              </>
            ) : authState.isAuthenticated ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="default">Authenticated</Badge>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive">Not Authenticated</Badge>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">User:</span>
          <span className="text-sm font-medium">{displayName}</span>
        </div>

   

        <div className="text-xs text-muted-foreground pt-2 border-t">
          This component uses Jotai atoms to access auth state from anywhere in the app!
        </div>
      </CardContent>
    </Card>
  );
} 