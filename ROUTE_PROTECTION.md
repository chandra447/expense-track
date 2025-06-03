# Route Protection with Next.js Middleware & Clerk

This guide covers different approaches to protect routes in your Next.js application using middleware.

## 🛡️ **Method 1: Clerk's Built-in Middleware (Recommended)**

### `middleware.ts` (Root level)

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/expenses(.*)',
  '/settings(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

**Benefits:**
- ✅ **Server-side protection** - runs before page loads
- ✅ **Automatic redirects** to sign-in page
- ✅ **Better SEO** - protected content never renders
- ✅ **Performance** - no client-side auth checks needed
- ✅ **Security** - prevents unauthorized access at the edge

## 🔧 **Method 2: Custom Middleware with Redirects**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/about',
  '/contact',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const { pathname } = req.nextUrl

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to sign-in
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect authenticated users away from auth pages
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

## 🎯 **Method 3: Role-Based Protection**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  // Protect admin routes
  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    
    // Check if user has admin role
    const role = sessionClaims?.metadata?.role
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // Protect general routes
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  return NextResponse.next()
})
```

## 📁 **Method 4: Directory-Based Protection**

Protect entire directory structures:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Protect all routes under these directories
const isProtectedRoute = createRouteMatcher([
  '/app/(.*)',      // All app routes
  '/dashboard(.*)', // Dashboard and sub-routes
  '/user/(.*)',     // User profile routes
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})
```

## 🔄 **Method 5: Conditional Protection with Query Params**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const { pathname, searchParams } = req.nextUrl

  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    
    // Preserve the original URL for redirect after sign-in
    signInUrl.searchParams.set('redirect_url', `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
    
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})
```

## 🎨 **Page Implementation (No Auth Logic Needed)**

With middleware protection, your pages become much cleaner:

```typescript
// src/app/dashboard/page.tsx
"use client";

import { ExpensesList } from '@/components/expenses-list';
import { UserProfile } from '@/components/user-profile';

export default function DashboardPage() {
  // No auth checks needed - middleware handles protection
  return (
    <main className="container mx-auto max-w-4xl p-4">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UserProfile />
          </div>
          <div className="lg:col-span-2">
            <ExpensesList />
          </div>
        </div>
      </div>
    </main>
  );
}
```

## 🚀 **Advanced: Environment-Based Protection**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isDevelopment = process.env.NODE_ENV === 'development'

// Different protection rules for different environments
const isProtectedRoute = createRouteMatcher(
  isDevelopment 
    ? ['/dashboard(.*)'] // Less restrictive in development
    : ['/dashboard(.*)', '/admin(.*)', '/api/internal(.*)'] // More restrictive in production
)

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth()
    
    if (!userId) {
      // In development, show a friendly message
      if (isDevelopment) {
        console.log(`🔒 Protected route accessed: ${req.nextUrl.pathname}`)
      }
      
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  return NextResponse.next()
})
```

## 📊 **Comparison: Middleware vs Client-Side Protection**

| Feature | Middleware | Client-Side |
|---------|------------|-------------|
| **Security** | ✅ Server-side, secure | ❌ Can be bypassed |
| **Performance** | ✅ Runs at edge | ❌ Requires JS load |
| **SEO** | ✅ No protected content indexed | ❌ May leak content |
| **User Experience** | ✅ Instant redirects | ❌ Flash of content |
| **Complexity** | ✅ Simple setup | ❌ Auth logic in every component |

## 🔧 **Testing Route Protection**

### Test Commands:
```bash
# Test unauthenticated access
curl -I http://localhost:3000/dashboard
# Should return 307 redirect to sign-in

# Test with authentication
curl -I http://localhost:3000/dashboard \
  -H "Cookie: __session=your-session-cookie"
# Should return 200 OK
```

### Browser Testing:
1. **Open incognito window**
2. **Navigate to** `http://localhost:3000/dashboard`
3. **Should redirect** to sign-in page
4. **Sign in and verify** access to dashboard

## 🎯 **Best Practices**

### ✅ **Do:**
- Use middleware for route protection
- Keep pages clean of auth logic
- Test protection in incognito mode
- Use specific route matchers
- Handle redirects gracefully

### ❌ **Don't:**
- Mix middleware and client-side protection
- Forget to test edge cases
- Hardcode redirect URLs
- Ignore query parameters in redirects
- Over-complicate the middleware logic

## 🚨 **Security Considerations**

1. **Always validate on server-side** - middleware runs on the server
2. **Protect API routes** - include API routes in matcher
3. **Handle edge cases** - consider all possible URL patterns
4. **Test thoroughly** - verify protection works as expected
5. **Monitor access** - log unauthorized access attempts

This middleware approach provides the most secure and performant route protection for your Next.js application! 🛡️ 