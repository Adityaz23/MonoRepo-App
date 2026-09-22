CREATE TABLE IF NOT EXISTS reply_reactions (
  id BIGSERIAL PRIMARY KEY,

  reply_id BIGINT NOT NULL
    REFERENCES replies(id)
    ON DELETE CASCADE,

  user_id BIGINT NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  reaction SMALLINT NOT NULL DEFAULT 1
    CHECK (reaction = 1),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_reply_reaction
    UNIQUE (reply_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reply_reactions_reply
  ON reply_reactions(reply_id);
