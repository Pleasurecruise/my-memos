import type { Memo, MemoStats, MemoVisibility, TagCount } from "$lib/types";
export type { Memo, MemoStats, MemoVisibility, TagCount };

export interface MemoListFilters {
  search?: string;
  date?: string;
  archivedOnly?: boolean;
  tags?: string[];
  publicOnly?: boolean;
  sortByUpdated?: boolean;
  cursor?: string;
  limit?: number;
}

export interface MemoPage {
  memos: Memo[];
  nextCursor: string | null;
}

export interface CreateMemoInput {
  content: string;
  visibility: import("$lib/types").MemoVisibility;
  tags: string[];
}

export interface UpdateMemoInput {
  content?: string;
  visibility?: import("$lib/types").MemoVisibility;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
}
