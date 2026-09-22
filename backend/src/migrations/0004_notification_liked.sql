CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  actor_user_id BIGINT
    REFERENCES users(id)
    ON DELETE SET NULL,

  type TEXT NOT NULL CHECK (
    type IN (
      'REPLY_ON_THREAD',
      'LIKE_ON_THREAD',
      'LIKE_ON_REPLY',
      'MENTION_IN_THREAD',
      'MENTION_IN_REPLY'
    )
  ),

  thread_id BIGINT
    REFERENCES threads(id)
    ON DELETE CASCADE,

  reply_id BIGINT
    REFERENCES replies(id)
    ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  read_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id)
  WHERE read_at IS NULL;
