import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { clerkMiddleware } from './config/clerk'
import { errorHandler } from './middlewares/errorHandler'
import { notFoundHandler } from './middlewares/notFoundHandler'
export function createApp() {
  const app = express()
  app.use(clerkMiddleware())
  app.use(helmet)
  app.use(cors({ origin: ['http://localhost:3000'], credentials: true }))
  app.use(express.json)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
