import { getAuth } from '@clerk/express'
import type { Request } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { BadRequest, ForbiddenError, NotFoundError, UnauthorisedError } from '../lib/errors'
import { createReplyNotification } from '../modules/notifications/notification.service'
import {
  createReply,
  deleteByReplyId,
  findReplyAuthor,
  getThreadByDetailsWithCount,
  likeThreadOnce,
  listRepliesForThread,
  removeLikeOnce,
} from '../modules/threads/replies.repository'
import {
  createdThread,
  listCategories,
  listThreads,
  parseThreadListFilter,
} from '../modules/threads/threads.repository'
import { getUserfromClerk } from '../modules/users/user.service'

// ---------- Schemas ----------

const createThreadSchema = z.object({
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(10).max(2000),
  categorySlug: z.string().trim().min(1),
})

const createReplySchema = z.object({
  body: z.string().trim().min(3, 'Reply is too short').max(2000, 'Reply is too long'),
})

// ---------- Helpers ----------

/** Parses and validates a positive integer id from a route param. */
const parseId = (raw: string | undefined, label = 'id'): number => {
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequest(`Invalid ${label}.`)
  }
  return n
}

/** Ensures the request is authenticated and returns the Clerk user id. */
const requireClerkUserId = (req: Request): string => {
  const { userId } = getAuth(req)
  if (!userId) {
    throw new UnauthorisedError('Unauthorised')
  }
  return userId
}

/** Ensures the request is authenticated and returns our internal user id. */
const requireCurrentUserId = async (req: Request) => {
  const clerkUserId = requireClerkUserId(req)
  const profile = await getUserfromClerk(clerkUserId)
  return profile.user.id
}

/**
 * Notifications are a side effect. If they fail, the main action (reply / like)
 * has already succeeded, so we log the failure instead of returning a 500.
 */
const safeNotify = async (label: string, fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (error) {
    console.error(`Failed to send ${label} notification:`, error)
  }
}

// ---------- Routes ----------

export const threadsRouter = Router()

// List categories
threadsRouter.get('/categories', async (_req, res, next) => {
  try {
    const categories = await listCategories()
    res.json({ data: categories })
  } catch (error) {
    next(error)
  }
})

// Create a new thread
threadsRouter.post('/threads', async (req, res, next) => {
  try {
    const authorUserId = await requireCurrentUserId(req)
    const parsedBody = createThreadSchema.parse(req.body)

    const newThread = await createdThread({
      categorySlug: parsedBody.categorySlug,
      authorUserId,
      title: parsedBody.title,
      body: parsedBody.body,
    })
    res.status(201).json({ data: newThread })
  } catch (error) {
    next(error)
  }
})

// Get a single thread by id
threadsRouter.get('/threads/:threadId', async (req, res, next) => {
  try {
    const threadId = parseId(req.params.threadId, 'thread id')
    const viewerUserId = await requireCurrentUserId(req)

    const thread = await getThreadByDetailsWithCount({ threadId, viewerUserId })
    if (!thread) {
      throw new NotFoundError('Thread not found.')
    }
    res.json({ data: thread })
  } catch (error) {
    next(error)
  }
})

// List all threads
threadsRouter.get('/threads', async (req, res, next) => {
  try {
    const filter = parseThreadListFilter({
      page: req.query.page,
      pageSize: req.query.pageSize,
      sort: req.query.sort,
      category: req.query.category,
      q: req.query.q,
    })
    const threads = await listThreads(filter)
    res.json({ data: threads })
  } catch (error) {
    next(error)
  }
})

// List replies for a thread
threadsRouter.get('/threads/:threadId/replies', async (req, res, next) => {
  try {
    requireClerkUserId(req)
    const threadId = parseId(req.params.threadId, 'thread id')

    const replies = await listRepliesForThread(threadId)
    res.json({ data: replies })
  } catch (error) {
    next(error)
  }
})

// Post a reply to a thread
threadsRouter.post('/threads/:threadId/replies', async (req, res, next) => {
  try {
    const authorUserId = await requireCurrentUserId(req)
    const threadId = parseId(req.params.threadId, 'thread id')
    const { body } = createReplySchema.parse(req.body)

    const reply = await createReply({ threadId, authorUserId, body })

    await safeNotify('reply', () =>
      createReplyNotification({ actorUserId: authorUserId, threadId })
    )

    res.status(201).json({ data: reply })
  } catch (error) {
    next(error)
  }
})

// Delete a reply (author only)
threadsRouter.delete('/replies/:replyId', async (req, res, next) => {
  try {
    const currentUserId = await requireCurrentUserId(req)
    const replyId = parseId(req.params.replyId, 'reply id')

    const authorUserId = await findReplyAuthor(replyId)
    if (authorUserId == null) {
      throw new NotFoundError('Reply not found.')
    }
    if (authorUserId !== currentUserId) {
      throw new ForbiddenError("You can't delete someone else's reply.")
    }

    await deleteByReplyId(replyId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// Like a thread
threadsRouter.post('/threads/:threadId/like', async (req, res, next) => {
  try {
    const userId = await requireCurrentUserId(req)
    const threadId = parseId(req.params.threadId, 'thread id')

    // Expected to return `false` when the like already existed.
    const created = await likeThreadOnce({ threadId, userId })

    // if (created !== false) {
    //   await safeNotify('like', () => createLikeNotification({ threadId, actorUserId: userId }))
    // }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// Remove a like from a thread
threadsRouter.delete('/threads/:threadId/like', async (req, res, next) => {
  try {
    const userId = await requireCurrentUserId(req)
    const threadId = parseId(req.params.threadId, 'thread id')

    await removeLikeOnce({ threadId, userId })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
