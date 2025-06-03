// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/expenses(.*)',
  '/settings(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  console.log(`🔍 Middleware checking: ${req.nextUrl.pathname}`)
  
  if (isProtectedRoute(req)) {
    console.log(`🔒 Protected route detected: ${req.nextUrl.pathname}`)
    const { userId } = await auth()
    console.log(`👤 User ID: ${userId || 'No user'}`)
    
    if (!userId) {
      console.log(`🚫 Redirecting unauthenticated user to home`)
      const homeUrl = new URL('/', req.url)
      homeUrl.searchParams.set('redirect_url', req.nextUrl.pathname)
      return NextResponse.redirect(homeUrl)
    }
    
    console.log(`✅ User authenticated, allowing access`)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

