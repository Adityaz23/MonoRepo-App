import { getAuth } from '@clerk/express'
import { Router } from 'express'
import { z } from 'zod'
import { BadRequest, UnauthorisedError } from '../lib/errors'
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
// schema for the threads creation ->
const createThreadSchema = z.object({
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(10).max(2000),
  categorySlug: z.string().trim().min(1),
})

export const threadsRouter = Router()
threadsRouter.get('/categories', async (req, res, next) => {
  try {
    const extractListOfCategories = await listCategories()
    res.json({ data: extractListOfCategories })
  } catch (error) {
    next(error)
  }
})

// Crating the new thread ->
threadsRouter.post('/threads', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('UnauthorisedError')
    }
    const parsedBody = createThreadSchema.parse(req.body)
    // extracting the infromation from the profile of the user.
    const profile = await getUserfromClerk(auth.userId)
    const newlyCreatedThread = await createdThread({
      categorySlug: parsedBody.categorySlug,
      authorUserId: profile.user.id,
      title: parsedBody.title,
      body: parsedBody.body,
    })
    res.status(200).json({ data: newlyCreatedThread })
  } catch (error) {
    next(error)
  }
})

// Generating the route to get the threads by the id ->
threadsRouter.get('/threads/:threadId', async (req, res, next) => {
  try {
    const threadId = Number(req.params.threadId)
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequest('Invalid thread id.')
    }
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('Unauthorised')
    }

    const profile = await getUserfromClerk(auth.userId)
    let viewerUserId = profile.user.id
    const thread = await getThreadByDetailsWithCount({ threadId, viewerUserId })
    res.json({ data: thread })
  } catch (error) {
    next(error)
  }
})

// List of all the threads.
threadsRouter.get('/threads', async (req, res, next) => {
  try {
    const filter = parseThreadListFilter({
      page: req.query.page,
      pageSize: req.query.pageSize,
      sort: req.query.sort,
      category: req.query.category,
      q: req.query.q,
    })
    const extractListOfThreads = await listThreads(filter)
    res.json({ data: extractListOfThreads })
  } catch (error) {
    next(error)
  }
})

// Thread route for the replies, upvote,downvote functionality ->
threadsRouter.get('/threads/:threadId/replies', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('Unauthorised')
    }
    const threadId = Number(req.params.threadId)
    const replies = await listRepliesForThread(threadId)
    res.json({ data: replies })
  } catch (error) {
    console.error(`Error : ${error}`)
    next(error)
  }
})

// Thread route for the post of thread =>
threadsRouter.post('/threads/:threadId/replies', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('Unauthorised')
    }
    const threadId = Number(req.params.threadId)
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequest('Invalid thread id')
    }
    const bodyRaw = typeof req.body?.body === 'string' ? req.body.body : ''
    if (bodyRaw.trim().length <= 2) {
      throw new BadRequest('Reply is too short')
    }
    const profile = await getUserfromClerk(auth.userId)
    const reply = await createReply({ threadId, authorUserId: profile.user.id, body: bodyRaw })
    // here we will trigger the notification
    res.status(201).json({ data: reply })
  } catch (error) {
    next(error)
  }
})

// Thread route for the delete of the post =>
threadsRouter.delete('/replies/:replyId', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('Unauthorised')
    }
    const replyId = Number(req.params.replyId)
    if (!Number.isInteger(replyId) || replyId <= 0) {
      throw new BadRequest('Invalid reply id.')
    }
    const profile = await getUserfromClerk(auth.userId)
    const authorUserId = await findReplyAuthor(replyId)

    if (authorUserId !== profile.user.id) {
      throw new UnauthorisedError("You can't delete this someone else replies.")
    }

    await deleteByReplyId(replyId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// Now for the like and removing the like =>
threadsRouter.post('/threads/:threadId/like', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('Unauthorised')
    }
    const threadId = Number(req.params.threadId)
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequest('Invalid id.')
    }
    const profile = await getUserfromClerk(auth.userId)
    await likeThreadOnce({ threadId, userId: profile.user.id })
    // here also the notification.
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

threadsRouter.delete('/threads/:threadId/like', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('Unauthorised')
    }
    const threadId = Number(req.params.threadId)
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw new BadRequest('Invalid id.')
    }
    const profile = await getUserfromClerk(auth.userId)
    await removeLikeOnce({ threadId, userId: profile.user.id })
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
