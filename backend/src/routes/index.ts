import { Router } from 'express'
import { notificationRouter } from './notification.routes'
import { threadsRouter } from './threads.routes'
import { userRouter } from './user.routes'
// main router ->
export const apiRouter = Router()
apiRouter.use('/me', userRouter)
apiRouter.use('/threads', threadsRouter)
apiRouter.use('/notifications', notificationRouter)
