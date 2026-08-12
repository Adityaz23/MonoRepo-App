// We might need to create clerk client here so we can create them directly here from the database and can use them anywhere in the application.
import { clerkClient, clerkMiddleware, getAuth } from '@clerk/express'
import type { NextFunction, Request, Response } from 'express'
import { env } from './env'
import { UnauthorisedError } from '../lib/errors'
export { clerkClient, clerkMiddleware, getAuth }

// Explicitly pass keys so it's not dependent on env var names
export const clerkMiddlewareConfigured = clerkMiddleware({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
})
export function requireAuthApi(req: Request, _res: Response, next: NextFunction): void {
  const auth = getAuth(req)
  if (!auth.userId) {
    return next(new UnauthorisedError('You must be signed in to access this resource!'))
  }
  return next()
}
