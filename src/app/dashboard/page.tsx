"use client";

import { UserProfile } from '@/components/user-profile';
import { ExpensesList } from '@/components/expenses-list';
import { AuthStatus } from '@/components/auth-status';

export default function DashboardPage() {
  return (
    <main className="container mx-auto max-w-4xl p-4">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your expense tracking dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UserProfile />
            <AuthStatus />
          </div>
          <div className="lg:col-span-2">
            <ExpensesList />
          </div>
        </div>
      </div>
    </main>
  );
} 