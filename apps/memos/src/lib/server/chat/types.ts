import type { Model, ProviderHeaders } from "@my-memos/ai-core";

export interface CachedMarkdown {
  value: string;
  etag: string | null;
  expiresAt: number;
}

export interface MemoryResult {
  changed: boolean;
  memory: string;
}

export interface ChatProvider {
  model: Model<"openai-completions">;
  headers: ProviderHeaders;
}
