CREATE TABLE IF NOT EXISTS memos (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  tags_json TEXT NOT NULL DEFAULT '[]',
  excerpt TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1))
);

CREATE INDEX IF NOT EXISTS memos_created_at_idx ON memos (created_at DESC);
CREATE INDEX IF NOT EXISTS memos_archived_idx ON memos (archived, created_at DESC);
CREATE INDEX IF NOT EXISTS memos_pinned_idx ON memos (pinned DESC, created_at DESC);
