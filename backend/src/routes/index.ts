import { Router } from 'express'
import { threadsRouter } from './threads.routes'
import { userRouter } from './user.routes'
// main router ->
export const apiRouter = Router()
apiRouter.use('/me', userRouter)
apiRouter.use('/threads', threadsRouter)
