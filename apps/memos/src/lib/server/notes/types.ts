import type { TocEntry, VisualBlock } from "$lib/types";

export interface NoteInput {
  body: string;
  title: string;
  category: string;
}

export interface NoteDocument {
  html: string;
  toc: TocEntry[];
  visualBlocks: VisualBlock[];
  excerpt: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  source: string;
  editorHtml: string;
}

export interface NotePageData extends NoteDocument {
  categories: string[];
  defaultCategory: string;
}

export interface NoteListing {
  paths: string[];
  fileMeta: Record<string, { size: number; createdAt: string; updatedAt: string; title: string }>;
}

export type NoteErrorCode = "already_exists" | "invalid_input" | "not_found" | "storage_failure";

export class NoteError extends Error {
  constructor(
    readonly code: NoteErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "NoteError";
  }
}
