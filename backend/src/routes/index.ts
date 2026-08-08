import { Router } from 'express'
import { userRouter } from './user.routes'
// main router ->
export const apiRouter = Router()
apiRouter.use('/me', userRouter)
