import { query } from '../../db/db'
import { type User, type UserRow } from './user.types'

function hydrateUser(row: UserRow): User {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    handle: row.handle,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
export async function upsertUserFromClerkProfile(params: {
  clerkUserId: string
  displayName: string | null
  avatarUrl: string | null
}): Promise<User> {
  const { clerkUserId, displayName, avatarUrl } = params
  const result = await query<UserRow>(
    `
    INSERT INTO users(clerk_user_id,display_name,avatar_url)
    VALUES($1, $2, $3)
    ON CONFLICT(clerk_user_id)
    DO UPDATE SET
       display_name = EXCLUDED.display_name,
       avatar_url = EXCLUDED.avatar_url
       updated_at =NOW()
    RETURNING
      id,
      clerk_user_id,
      display_name,
      handle,
      avatar_url,
      bio,
      created_at,
      updated_at
    `,
    [clerkUserId, displayName, avatarUrl]
  )
  if (!result.rows[0]) {
    throw new Error('Failed to upsert user')
  }
  return hydrateUser(result.rows[0])
}
