import { query } from '../../db/db'
import { BadRequest, NotFoundError } from '../../lib/errors'
import { getThreadById } from './threads.repository'

export async function listRepliesForThread(threadId: number) {
  if (!Number.isInteger(threadId) || threadId <= 0) {
    throw new BadRequest('Invalid thread id')
  }
  const result = await query(
    `
    SELECT
      r.id,
      r.body,
      r.created_at,
      u.display_name AS author_display_name,
      u.handle AS author_handle
    FROM replies r
    JOIN users u ON u.id = r.author_user_id
    WHERE r.thread_id = $1
    ORDER BY r.created_at ASC
    `,
    [threadId]
  )
  return result.rows.map(row => ({
    id: row.id as number,
    body: row.body as string,
    createdAt: row.created_at as Date,
    author: {
      displayName: (row.author_display_name as string) ?? null,
      handle: (row.author_handle as string) ?? null,
    },
  }))
}

export async function createReply(params: {
  threadId: number
  authorUserId: number
  body: string
}) {
  const { body, threadId, authorUserId } = params
  const result = await query(
    `
    INSERT INTO replies (thread_id, author_user_id, body)
    VALUES ($1, $2, $3)
    RETURNING id, created_at
    `,
    [threadId, authorUserId, body]
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error('Failed to create reply')
  }
  const fullRes = await query(
    `
    SELECT
      r.id,
      r.body,
      r.created_at,
      u.display_name AS author_display_name,
      u.handle AS author_handle
    FROM replies r
    JOIN users u ON u.id = r.author_user_id
    WHERE r.id = $1
    LIMIT 1
    `,
    [row.id]
  )
  const replyRow = fullRes.rows[0]
  if (!replyRow) {
    throw new Error('Reply not found after creation')
  }
  return {
    id: replyRow.id as number,
    body: replyRow.body as string,
    createdAt: replyRow.created_at as Date,
    author: {
      displayName: (replyRow.author_display_name as string) ?? null,
      handle: (replyRow.author_handle as string) ?? null,
    },
  }
}

export async function findReplyAuthor(replyId: number) {
  const result = await query(
    `
    SELECT author_user_id
    FROM replies
    WHERE id = $1
    LIMIT 1
    `,
    [replyId]
  )
  const row = result.rows[0]
  if (!row) {
    throw new NotFoundError('Reply Not Found')
  }
  return row.author_user_id as number
}

export async function deleteByReplyId(replyId: number) {
  await query(
    `
    DELETE FROM replies
    WHERE id = $1
    `,
    [replyId]
  )
}

export async function likeThreadOnce(params: { threadId: number; userId: number }) {
  const { threadId, userId } = params
  await query(
    `
    INSERT INTO thread_reactions (thread_id, user_id)
    VALUES ($1,$2)
    ON CONFLICT (thread_id, user_id) DO NOTHING
    `,
    [threadId, userId]
  )
}

export async function removeLikeOnce(params: { threadId: number; userId: number }) {
  const { threadId, userId } = params
  await query(
    `
    DELETE FROM thread_reactions
    WHERE thread_id = $1 AND user_id = $2
    `,
    [threadId, userId]
  )
}

export async function getThreadByDetailsWithCount(params: {
  threadId: number
  viewerUserId: number | null
}) {
  const { threadId, viewerUserId } = params
  const threadDetails = getThreadById(threadId)
  const likeCount = await query(
    `
    SELECT COUNT(*)::INT as count
    FROM thread_reactions
    WHERE thread_id = $1`,
    [threadId]
  )
  const likeCountRow = (likeCount.rows[0]?.count as number | undefined) ?? 0
  const replyResult = await query(
    `
    SELECT COUNT(*)::INT as count
    FROM replies
    WHERE thread_id = $1`,
    [threadId]
  )
  const replyCountRow = (replyResult.rows[0]?.count as number | undefined) ?? 0
  let viewerHasLikedThisPostOrNot = false
  if (viewerUserId) {
    const viewerResult = await query(
      `SELECT $1
      FROM thread_reactions
      WHERE thread_id = $1 AND user_id = $2
      LIMIT 1`,
      [threadId, viewerUserId]
    )
    const count = viewerResult.rowCount ?? 0
    if (count > 0) {
      viewerHasLikedThisPostOrNot = true
    }
    return { ...threadDetails, likeCount, replyResult, viewerHasLikedThisPostOrNot }
  }
}
