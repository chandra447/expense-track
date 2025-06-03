import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { expenseRoute } from './expenses'
import { tagRoute } from './tags'
import { logger } from "hono/logger";
import { clerkMiddleware } from '@hono/clerk-auth'

export const runtime = 'edge'

const app = new Hono().basePath("/api");
app.use(logger());

// Configure Clerk middleware with proper environment variables
app.use('*', clerkMiddleware({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: process.env.CLERK_SECRET_KEY!
}));

// Add a health check route
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const apiRoutes = app.route("/expenses", expenseRoute).route("/tags", tagRoute);

export type ApiRoutes = typeof apiRoutes;

export const GET = handle(apiRoutes)
export const POST = handle(apiRoutes)
export const PUT = handle(apiRoutes)
export const DELETE = handle(apiRoutes)
export const PATCH = handle(apiRoutes)