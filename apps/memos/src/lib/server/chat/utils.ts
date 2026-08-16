import type { UserChatMessage } from "$lib/chat/types";

export function messageText(message: UserChatMessage) {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function chatErrorText(error: unknown) {
  console.error("[chat] run failed", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message.slice(0, 1_000) : String(error).slice(0, 1_000),
    aborted: error instanceof DOMException && error.name === "AbortError",
  });
  return "The assistant request failed.";
}
