import { runAgent } from "@my-memos/ai-core";
import { createChatProvider } from "./model";
import { invalidateMarkdown } from "./prompt-cache";
import type { AppEnv } from "$lib/server/types";
import { latestAssistantText, parseMemoryResult } from "./utils";

const MEMORY_KEY = "agent/MEMORY.md";
const DEDUPE_PREFIX = "agent:memory-update:";

async function summarize(
  env: AppEnv,
  memory: string,
  user: string,
  assistant: string,
  signal?: AbortSignal,
) {
  const provider = createChatProvider(env);
  const prompt = `Current long-term memory:\n<memory>\n${memory}\n</memory>\n\nLatest user message:\n${user}\n\nAssistant reply:\n${assistant}\n\nReturn JSON only: {"changed": boolean, "memory": string}. The memory field must be the complete, organized Markdown file. Save only explicit durable identity, preferences, work habits, long-term projects, and remember/forget instructions. Replace corrected facts and remove forgotten facts. Do not save temporary tasks, ordinary chat, raw tool output, assistant inferences not confirmed by the user, credentials, secrets, or sensitive data. Merge duplicates. If nothing qualifies, return changed=false and the current memory unchanged.`;
  const result = await runAgent({
    systemPrompt: "You maintain a concise personal memory file. Follow privacy rules strictly.",
    model: provider.model,
    messages: [{ role: "user", content: prompt, timestamp: Date.now() }],
    tools: [],
    headers: provider.headers,
    signal,
  });
  return parseMemoryResult(latestAssistantText(result));
}

async function updateOnce(env: AppEnv, user: string, assistant: string) {
  const object = await env.MEMOS_BUCKET.get(MEMORY_KEY);
  const current = object ? await object.text() : "";
  const result = await summarize(env, current, user, assistant);
  if (!result.changed || result.memory === current.trim()) return "unchanged" as const;

  const written = await env.MEMOS_BUCKET.put(MEMORY_KEY, result.memory, {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
    onlyIf: object ? { etagMatches: object.etag } : { etagDoesNotMatch: "*" },
  });
  if (!written) return "conflict" as const;
  invalidateMarkdown(MEMORY_KEY);
  return "updated" as const;
}

export async function updateMemoryAfterChat(
  env: AppEnv,
  messageId: string,
  user: string,
  assistant: string,
) {
  if (!messageId || !user || !assistant) return;
  const key = `${DEDUPE_PREFIX}${messageId}`;
  if (await env.MEMOS_CACHE.get(key)) return;
  await env.MEMOS_CACHE.put(key, "pending", { expirationTtl: 3600 });

  try {
    let outcome = await updateOnce(env, user, assistant);
    if (outcome === "conflict") outcome = await updateOnce(env, user, assistant);
    if (outcome === "conflict") console.warn("[memory] second R2 ETag conflict", { messageId });
    await env.MEMOS_CACHE.put(key, outcome, { expirationTtl: 3600 });
  } catch (error) {
    console.error("[memory] background update failed", {
      messageId,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    await env.MEMOS_CACHE.put(key, "failed", { expirationTtl: 300 });
  }
}
