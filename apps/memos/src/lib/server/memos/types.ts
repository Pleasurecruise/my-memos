export type { Memo, MemoVisibility, TagCount } from "$lib/types/memos";

export interface MemoListFilters {
  search?: string;
  date?: string;
  includeArchived?: boolean;
  tag?: string;
}

export interface CreateMemoInput {
  content: string;
  visibility: import("$lib/types/memos").MemoVisibility;
  tags: string[];
}

export interface UpdateMemoInput {
  content?: string;
  visibility?: import("$lib/types/memos").MemoVisibility;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
}
