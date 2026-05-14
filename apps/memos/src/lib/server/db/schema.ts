import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const memos = sqliteTable(
  "memos",
  {
    id: text("id").primaryKey(),
    r2Key: text("r2_key").notNull().unique(),
    tagsJson: text("tags_json", { mode: "json" }).$type<string[]>().notNull().default([]),
    excerpt: text("excerpt").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    visibility: text("visibility", { enum: ["public", "private"] }).notNull(),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    index("memos_created_at_idx").on(t.createdAt),
    index("memos_archived_idx").on(t.archived, t.createdAt),
    index("memos_pinned_idx").on(t.pinned, t.createdAt),
  ],
);

export type MemoRow = typeof memos.$inferSelect;
