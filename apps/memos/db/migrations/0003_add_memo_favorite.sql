ALTER TABLE memos ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1));

CREATE INDEX IF NOT EXISTS memos_favorite_idx
  ON memos (favorite, archived, pinned DESC, created_at DESC);
