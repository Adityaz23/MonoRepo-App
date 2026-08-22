import { getAuth } from '@clerk/express'
import { Router } from 'express'
import { z } from 'zod'
import { BadRequest, UnauthorisedError } from '../lib/errors'
import {
  createdThread,
  getThreadById,
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
    console.error(`Error: ${error}`)
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
    console.error(`Error: ${error}`)
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

    // const profile = await getUserfromClerk(auth.userId)
    // let viewerUserId = profile.user.id
    const thread = await getThreadById(threadId)
    res.json({ data: thread })
  } catch (error) {
    console.error(`Error: ${error}`)
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
    console.error(`Error :${error}`)
  }
})
