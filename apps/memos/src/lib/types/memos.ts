export type MemoVisibility = "public" | "protected" | "private";

export interface Memo {
  id: string;
  r2Key: string;
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
