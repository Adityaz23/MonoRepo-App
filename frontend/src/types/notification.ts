export type NotificationType = 'REPLY_ON_THREAD' | 'LIKE_ON_THREAD' | 'MENTION_ON_THREAD'
export type Notification = {
  id: number
  type: NotificationType | string
  threadId: string
  createdAt: string
  readAt: string | null
  actor: {
    displayName: string | null
    handle: string | null
  }
  thread: {
    title: string
  }
}

// socket connection is a bidirectional to the frontend and backend. It is just like a dispatching and receiving at the other side of the connection to the sender.
