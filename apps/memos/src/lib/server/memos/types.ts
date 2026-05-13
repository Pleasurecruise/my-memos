export type { Memo, MemoVisibility, TagCount } from "$lib/types";

export interface MemoListFilters {
  search?: string;
  date?: string;
  archivedOnly?: boolean;
  tags?: string[];
  publicOnly?: boolean;
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
