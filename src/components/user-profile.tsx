"use client";

import { useAuth, useUserDisplayName } from "@/hooks/use-auth";
import { useAtomValue } from "jotai";
import {
  totalExpensesAtom,
  tagsCountAtom,
  isLoadingAtom,
} from "@/store/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, DollarSign, Tag } from "lucide-react";

// This component shows WHEN to use our Jotai auth hooks - when you need user-specific data
export function UserProfile() {
  const { userId, isLoaded, user } = useAuth(); // Using our Jotai-based hook
  const displayName = useUserDisplayName(); // Using computed atom
  
  // Use Jotai atoms for real-time statistics
  const totalExpenses = useAtomValue(totalExpensesAtom);
  const tagsCount = useAtomValue(tagsCountAtom);
  const isLoading = useAtomValue(isLoadingAtom);

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!userId || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please sign in to view your profile</p>
        </CardContent>
      </Card>
    );
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          {user.imageUrl && (
            <img
              src={user.imageUrl}
              alt="Profile"
              className="h-12 w-12 rounded-full"
            />
          )}
          <div>
            <p className="font-medium">{displayName}</p>
            {user.email && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">${formatAmount(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Tag className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{tagsCount}</p>
              <p className="text-xs text-muted-foreground">Tags Created</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 