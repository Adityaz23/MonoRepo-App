import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { clerkMiddlewareConfigured } from './config/clerk'
import { errorHandler } from './middlewares/errorHandler'
import { notFoundHandler } from './middlewares/notFoundHandler'
import { apiRouter } from './routes'
export function createApp() {
  const app = express()
  app.use(cors({ origin: ['http://localhost:3001', 'http://localhost:3000'], credentials: true }))
  app.use(clerkMiddlewareConfigured)
  app.use(helmet())
  app.use(express.json())
  app.use('/api', apiRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
