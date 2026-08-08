// in this file we are generating routes for the users who are authenticated and want to perform some tasks like patch, edit , many more ->
import { Router } from 'express'
import { z } from 'zod'
import { getAuth } from '../config/clerk'
import { UnauthorisedError } from '../lib/errors'
import { getUserfromClerk } from '../modules/users/user.service'
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
    console.error(`Error: ${error}`)
  }
})
