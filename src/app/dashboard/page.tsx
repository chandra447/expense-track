"use client";

import { UserProfile } from '@/components/user-profile';
import { ExpensesList } from '@/components/expenses-list';
import { AuthStatus } from '@/components/auth-status';


export default function DashboardPage() {
  return (
    <main className="container mx-auto max-w-7xl p-4">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your expense tracking dashboard
          </p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left sidebar - User info and AI Chat */}
          <div className="xl:col-span-1 space-y-6">
            <UserProfile />
            <AuthStatus />
          </div>
          
          {/* Center - Expenses List */}
          <div className="xl:col-span-2">
            <ExpensesList />
          </div>
          
      
        </div>
      </div>
    </main>
  );
} 