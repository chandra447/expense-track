"use client";

import { useAuth, useUserDisplayName } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";
import {
  totalExpensesAtom,
  tagsCountAtom,
  expensesCountAtom,
  isLoadingAtom,
} from "@/store/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Calendar, 
  DollarSign, 
  Tag, 
  Receipt,
  Edit,
  Camera
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoaded } = useAuth();
  const displayName = useUserDisplayName();
  const router = useRouter();
  
  // Use Jotai atoms for real-time statistics
  const totalExpenses = useAtomValue(totalExpensesAtom);
  const tagsCount = useAtomValue(tagsCountAtom);
  const expensesCount = useAtomValue(expensesCountAtom);
  const isLoading = useAtomValue(isLoadingAtom);

  if (!isLoaded) {
    return (
      <main className="container mx-auto max-w-4xl p-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container mx-auto max-w-4xl p-4">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </div>
      </main>
    );
  }

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="container mx-auto max-w-4xl p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={displayName}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                      {displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Expense Tracker Member
                  </p>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Full Name</p>
                    <p className="text-sm text-muted-foreground">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : displayName
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Account Status</p>
                    <Badge variant="default" className="mt-1">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Account Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-3xl font-bold">${formatAmount(totalExpenses)}</p>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{expensesCount}</p>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{tagsCount}</p>
                      <p className="text-xs text-muted-foreground">Tags</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground text-center">
                      Keep tracking your expenses to build better financial habits!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => router.push("/dashboard")}
              >
                <Receipt className="mr-2 h-4 w-4" />
                View All Expenses
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => router.push("/dashboard")}
              >
                <Tag className="mr-2 h-4 w-4" />
                Manage Tags
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => router.push("/dashboard")}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 