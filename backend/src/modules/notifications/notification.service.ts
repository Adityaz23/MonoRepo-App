// the end points we are going to create at for the notifications ->
// the method would be get unreadonly=true|false
// /api/notifications?unreadonly=true|false

import { query } from '../../db/db'
import { getIo } from '../../realtime/iosocket'
import { mapNotificationRow, type NotificationRow } from './notifications.types'

// now the method is post
// /api/notifications/read-all

// this will be for the user to click on the particular notification and then to go to that particular threads page ->
// the method would be post
// /api/notifications/:id/read

// this is for the reply notification
export async function createReplyNotification({
  threadId,
  actorUserId,
}: {
  threadId: number
  actorUserId: number
}) {
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
  const io = getIo()
  if (io) {
    io.to(`notifications:user:${authorUserId}`).emit('notification:new', payload)
  }
}

// this is for liking the thread
export async function createLikeNotification({
  threadId,
  actorUserId,
}: {
  threadId: number
  actorUserId: number
}) {
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
  const io = getIo()
  if (io) {
    io.to(`notifications:user:${authorUserId}`).emit('notification:new', payload)
  }
}

// this is for the lsiting all the notification.
export async function listNotificationForUsers(params: { userId: number; unreadOnly: boolean }) {
  const { userId, unreadOnly } = params
  const conditions = ['n.user_id = $1']
  const values: unknown[] = [userId]

  if (unreadOnly) {
    conditions.push('n.read_at IS NULL')
  }
  const whereClause = `WHERE ${conditions.join(' AND ')}`

  const result = await query(
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
    ${whereClause}
    ORDER BY n.created_at DESC
    `,
    values
  )
  return result.rows.map(noti => mapNotificationRow(noti as NotificationRow))
}

// marking the notification as mark as read =>
export async function markNotificationAsRead(params: { userId: number; notificationId: number }) {
  const { userId, notificationId } = params
  await query(
    `
    UPDATE notifications
    SET read_at = COALESCE(read_at, NOW())
    WHERE id = $1 AND user_id = $2
    `,
    [userId, notificationId]
  )
}

// marking all the notification as mark as read =>
export async function markAllNotificationRead(params: { userId: number }) {
  const { userId } = params
  const result = await query(
    `
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = $1 AND read_at IS NULL
    `,
    [params, userId]
  )
  return result.rowCount ?? 0
}

// this is the handle for mentioning the user in the reply =>
export async function createMentionInReplyNotifications(params: {
  mentionUserId: number
  actorUserId: number
  threadId: number
  replyId: number
}) {
  const { mentionUserId, actorUserId, threadId, replyId } = params
  //don't notify is the user is not mention in the reply =>
  if (mentionUserId === actorUserId) return

  const result = await query(
    `
    INSERT INTO notifications (user_id, actor_user_id, thread_id, reply_id, type)
    VALUES ($1, $2, $3, $4, 'MENTION_IN_REPLY')
    RETURNING id, created_at
    `,
    [mentionUserId, actorUserId, threadId, replyId]
  )
  const notificationRow = result.rows[0] as { id: number } | undefined
  if (!notificationRow) {
    return
  }
  const fullResponse = await query(
    `
    SELECT
      n.id,
      n.type,
      n.thread_id,
      n.reply_id,
      n.created_at,
      n.read_at,
      actor.display_name AS actor_display_name,
      actor.handle AS actor_handle,
      t.title AS thread_title
    FROM notifications n
    LEFT JOIN users actor ON actor.id = n.actor_user_id
    JOIN threads t ON t.id = n.thread_id
    WHERE n.id = $1
    LIMIT 1
    `,
    [notificationRow.id]
  )
  const fullRow = fullResponse.rows[0] as NotificationRow | undefined
  if (!fullRow) {
    return
  }
  const payload = mapNotificationRow(fullRow)

  // now here we will emit the socket connection ->
  const io = getIo()
  if (io) {
    io.to(`notifications:user:${actorUserId}`).emit('notification:new', payload)
  }
}
