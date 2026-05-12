export type MemoVisibility = "public" | "private";

export interface Memo {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  visibility: MemoVisibility;
  pinned: boolean;
  archived: boolean;
}

export interface TagCount {
  name: string;
  count: number;
}
