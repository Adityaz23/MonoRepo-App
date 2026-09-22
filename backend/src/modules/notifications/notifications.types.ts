export type NotificationRow = {
  id: number
  type: string
  thread_id: string
  created_at: Date
  read_at: Date | null
  actor_display_name: string | null
  actor_handle: string | null
  thread_title: string | null
}
export type Notification = {
  id: number
  type: string
  threadId: string
  createdAt: string
  read_At: string | null
  actor: {
    display_name: string | null
    handle: string | null
  }
  thread: {
    title: string
  }
}
export function mapNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    threadId: row.thread_id,
    createdAt: row.created_at.toISOString(),
    read_At: row.read_at ? row.read_at.toISOString() : null,
    actor: { display_name: row.actor_display_name, handle: row.actor_handle },
    thread: {
      title: row.thread_title ?? '',
    },
  }
}
