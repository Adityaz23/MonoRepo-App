import { getAuth } from '@clerk/express'
import { Router } from 'express'
import { UnauthorisedError } from '../lib/errors'
import {
  listNotificationForUsers,
  markNotificationAsRead,
} from '../modules/notifications/notification.service'
import { getUserfromClerk } from '../modules/users/user.service'

export const notificationRouter = Router()
notificationRouter.get('/', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('Please Sign In')
    }
    const profile = await getUserfromClerk(auth.userId)
    const isUnreadOnly = req.query.unreadOnly === 'true'
    const notifications = await listNotificationForUsers({
      userId: profile.user.id,
      unreadOnly: isUnreadOnly,
    })
    res.json({ data: notifications })
  } catch (error) {
    next(error)
  }
})
notificationRouter.post('/:id/read', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('Please Sign In')
    }
    const notificationId = Number(req.params.id)
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      res.status(400).json({ error: 'Invalid notification id' })
      return
    }
    const profile = await getUserfromClerk(auth.userId)
    const result = await markNotificationAsRead({
      userId: profile.user.id,
      notificationId,
    })
  } catch (error) {
    next(error)
  }
})
