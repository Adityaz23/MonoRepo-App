// the end points we are going to create at for the notifications ->
// the method would be get unreadonly=true|false
// /api/notifications?unreadonly=true|false

import { query } from '../db/db'
import {
  mapNotificationRow,
  type NotificationRow,
} from '../modules/notifications/notifications.types'

// now the method is post
// /api/notifications/read-all

// this will be for the user to click on the particular notification and then to go to that particular threads page ->
// the method would be post
// /api/notifications/:id/read

// this is for the reply notification
export async function createReplyNotification(params: [threadId: number, actorUserId: number]) {
  const [threadId, actorUserId] = params
  const threadResponse = await query(
    `
    SELECT author_user_id
    FROM threads
    WHERE id = $1
    LIMIT 1
    `,
    [threadId]
  )
  const row = threadResponse.rows[0] as { author_user_id: number } | undefined
  if (!row) {
    return
  }
  const authorUserId = row.author_user_id
  if (authorUserId === actorUserId) return
  const insertResponse = await query(
    `
    INSERT INTO notifications (user_id, actor_user_id, thread_id, type)
    VALUES ($1, $2, $3, 'REPLY_ON_THREAD')
    RETURNING id, created_at
    `,
    [authorUserId, actorUserId, threadId]
  )
  const notificationRows = insertResponse.rows[0] as { id: number }
  if (!notificationRows) {
    return
  }
  const fullResponse = await query(
    `
    SELECT
      n.id,
      n.type,
      n.thread_id,
      n.created_at,
      n.read_at,
      actor.display_name AS actor_display_name,
      actor.handle AS actor_handle,
      t.title AS thread_title
    FROM notifications n
    JOIN users actor ON actor.id = n.actor_user_id
    JOIN threads t ON t.id = n.thread_id
    WHERE n.id = $1
    LIMIT 1
    `,
    [notificationRows.id]
  )
  const fullRow = fullResponse.rows[0] as NotificationRow | undefined
  if (!fullRow) {
    return
  }
  const payload = mapNotificationRow(fullRow)

  // this is where we are going to emit our first socket event.
}

// this is for liking the thread
export async function createLikeNotification(params: [threadId: number, actorUserId: number]) {
  const [threadId, actorUserId] = params
  const threadResponse = await query(
    `
    SELECT author_user_id
    FROM threads
    WHERE id = $1
    LIMIT 1
    `,
    [threadId]
  )
  const row = threadResponse.rows[0] as { author_user_id: number } | undefined
  if (!row) {
    return
  }
  const authorUserId = row.author_user_id
  if (authorUserId === actorUserId) return
  const insertResponse = await query(
    `
    INSERT INTO notifications (user_id, actor_user_id, thread_id, type)
    VALUES ($1, $2, $3, 'LIKE_ON_THREAD')
    RETURNING id, created_at
    `,
    [authorUserId, actorUserId, threadId]
  )
  const notificationRows = insertResponse.rows[0] as { id: number }
  if (!notificationRows) {
    return
  }
  const fullResponse = await query(
    `
    SELECT
      n.id,
      n.type,
      n.thread_id,
      n.created_at,
      n.read_at,
      actor.display_name AS actor_display_name,
      actor.handle AS actor_handle,
      t.title AS thread_title
    FROM notifications n
    JOIN users actor ON actor.id = n.actor_user_id
    JOIN threads t ON t.id = n.thread_id
    WHERE n.id = $1
    LIMIT 1
    `,
    [notificationRows.id]
  )
  const fullRow = fullResponse.rows[0] as NotificationRow | undefined
  if (!fullRow) {
    return
  }
  const payload = mapNotificationRow(fullRow)

  // this is where we are going to emit our first socket event.
}

// this is for the lsiting all the notification.
