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

export interface MemoStats {
  total: number;
  today: number;
}

export interface TocEntry {
  depth: number;
  text: string;
  id: string;
}

export type VisualBlockType = "svg" | "mermaid" | "chart" | "widget";

export interface VisualBlock {
  type: VisualBlockType;
  code: string;
  index: number;
}
