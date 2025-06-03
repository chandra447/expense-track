"use client";

import Link from "next/link"
import { BadgeDollarSign, LayoutDashboard, Settings, PlusCircle, BarChart3 } from "lucide-react"
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { Button } from './ui/button'
import { UserDropdown } from './user-dropdown'

export function Navbar(){
    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Left side - Logo and main navigation */}
                    <div className="flex items-center space-x-6">
                        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                            <BadgeDollarSign className="h-6 w-6 text-primary" />
                            <span className="font-bold text-lg">Expense Tracker</span>
                        </Link>
                        
                        {/* Navigation links for signed-in users */}
                        <SignedIn>
                            <div className="hidden md:flex items-center space-x-4">
                                <Link 
                                    href="/dashboard" 
                                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Link>
                                
                                <Link 
                                    href="/reports" 
                                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    <span>Reports</span>
                                </Link>
                            </div>
                        </SignedIn>
                        
                        {/* About link - always visible */}
                        <Link 
                            href="/about" 
                            className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            About
                        </Link>
                    </div>

                    {/* Right side - Authentication */}
                    <div className="flex items-center space-x-4">
                        <SignedOut>
                            <Button asChild>
                                <Link href="/auth">
                                    Sign In
                                </Link>
                            </Button>
                        </SignedOut>
                        
                        <SignedIn>
                            <div className="flex items-center space-x-3">
                                {/* Custom User Dropdown */}
                                <UserDropdown />
                            </div>
                        </SignedIn>
                    </div>
                </div>
                
                {/* Mobile navigation for signed-in users */}
                <SignedIn>
                    <div className="md:hidden border-t pt-3 pb-3">
                        <div className="flex items-center space-x-4">
                            <Link 
                                href="/dashboard" 
                                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Dashboard</span>
                            </Link>
                            <Link 
                                href="/expenses" 
                                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <PlusCircle className="h-4 w-4" />
                                <span>Add Expense</span>
                            </Link>
                            <Link 
                                href="/reports" 
                                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <BarChart3 className="h-4 w-4" />
                                <span>Reports</span>
                            </Link>
                        </div>
                    </div>
                </SignedIn>
            </div>
        </nav>
    )
}