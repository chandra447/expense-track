"use client";

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { ExpensesList } from '@/components/expenses-list';

export default function Home() {
  return (
    <main className="container mx-auto max-w-lg p-4">
      <SignedOut>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Welcome to Expense Tracker</h1>
          <p className="text-muted-foreground mb-6">
            Track your expenses easily and securely. Sign in to get started.
          </p>
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Features:</h2>
            <ul className="text-left space-y-2">
              <li>• Track your daily expenses</li>
              <li>• Organize with custom tags</li>
              <li>• Secure authentication with Clerk</li>
              <li>• Beautiful, responsive interface</li>
            </ul>
          </div>
        </div>
      </SignedOut>
      
      <SignedIn>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Your Expenses</h1>
            <p className="text-muted-foreground">
              Manage and track your expenses
            </p>
          </div>
          <ExpensesList />
        </div>
      </SignedIn>
    </main>
  );
}
