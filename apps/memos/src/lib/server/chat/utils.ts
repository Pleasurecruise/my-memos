import type { AgentMessage } from "@my-memos/ai-core";
import { z } from "zod";
import type { UserChatMessage } from "$lib/chat/types";
import type { MemoryResult } from "./types";

const memoryResultSchema: z.ZodType<MemoryResult> = z.object({
  changed: z.boolean(),
  memory: z.string(),
});

export function messageText(message: UserChatMessage) {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function latestAssistantText(messages: AgentMessage[]) {
  const message = messages.findLast((item) => item.role === "assistant");
  if (!message || message.role !== "assistant") return "";
  return message.content.flatMap((part) => (part.type === "text" ? [part.text] : [])).join("\n");
}

export function parseMemoryResult(raw: string): MemoryResult {
  const json = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const result = memoryResultSchema.parse(JSON.parse(json));
  return { changed: result.changed, memory: result.memory.trim() };
}

export function chatErrorText(error: unknown) {
  console.error("[chat] run failed", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message.slice(0, 1_000) : String(error).slice(0, 1_000),
    aborted: error instanceof DOMException && error.name === "AbortError",
  });
  return "The assistant request failed.";
}
