// in this file we are generating routes for the users who are authenticated and want to perform some tasks like patch, edit , many more ->
import { Router } from 'express'
import { z } from 'zod'
import { getAuth } from '../config/clerk'
import { UnauthorisedError } from '../lib/errors'
import { getUserfromClerk, updateUserProfile } from '../modules/users/user.service'
import {
  toUserProfileResponse,
  type UserProfile,
  type UserProfileResponse,
} from '../modules/users/user.types'
export const userRouter = Router()

// in the patch route the user should be able to update the bio, name, handle and avatar url.
// user update schema =>
const UserProfileUpdateSchema = z.object({
  displayName: z.string().trim().max(50).optional(),
  handle: z.string().trim().max(50).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: z.url('Avatar must be a valid url').optional(),
})
// now getting the types of the user profile from the user.profile.ts
function toResponse(profile: UserProfile): UserProfileResponse {
  return toUserProfileResponse(profile)
}

userRouter.get('/', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('UnauthorisedError')
    }
    const profile = await getUserfromClerk(auth.userId)
    const response = toResponse(profile)
    res.json({ data: response })
  } catch (error) {
    next(error)
  }
})
// patch -> /api/me
userRouter.patch('/', async (req, res, next) => {
  try {
    const auth = getAuth(req)
    if (!auth.userId) {
      throw new UnauthorisedError('UnauthorisedError')
    }
    const parsedBody = UserProfileUpdateSchema.parse(req.body)
    const displayName =
      parsedBody.displayName && parsedBody.displayName.trim().length > 0
        ? parsedBody.displayName.trim()
        : undefined
    const handle =
      parsedBody.handle && parsedBody.handle.trim().length > 0
        ? parsedBody.handle.trim()
        : undefined
    const bio =
      parsedBody.bio && parsedBody.bio.trim().length > 0 ? parsedBody.bio.trim() : undefined
    const avatarUrl =
      parsedBody.avatarUrl && parsedBody.avatarUrl.trim().length > 0
        ? parsedBody.avatarUrl.trim()
        : undefined
    try {
      const profile = await updateUserProfile({
        clerkUserId: auth.userId,
        displayName,
        avatarUrl,
        bio,
      })
      const response = toResponse(profile)
      res.json({ data: response })
    } catch (e) {
      throw e
    }
  } catch (error) {
    next(error)
  }
})
