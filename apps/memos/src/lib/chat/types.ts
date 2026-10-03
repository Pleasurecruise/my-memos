import type { JsonObject, JsonValue } from "@my-memos/ai-core";

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

interface TextPart {
  type: "text";
  text: string;
}

interface ToolPartBase {
  type: "tool";
  toolCallId: string;
  toolName: string;
  input: JsonObject;
}

export type ToolPart =
  | (ToolPartBase & { state: "input-available" })
  | (ToolPartBase & { state: "output-available"; output: JsonValue })
  | (ToolPartBase & { state: "output-error"; errorText: string });

type ChatPart = TextPart | ToolPart;

export interface UserChatMessage {
  id: string;
  role: "user";
  parts: TextPart[];
}

interface AssistantStep {
  parts: ChatPart[];
}

export interface AssistantChatMessage {
  id: string;
  role: "assistant";
  steps: AssistantStep[];
}

export type ChatMessage = UserChatMessage | AssistantChatMessage;

export type ChatEvent =
  | { type: "assistant-step" }
  | { type: "text-delta"; delta: string }
  | { type: "tool-input"; toolCallId: string; toolName: string; input: JsonObject }
  | { type: "tool-output"; toolCallId: string; output: JsonValue }
  | { type: "tool-error"; toolCallId: string; errorText: string }
  | { type: "error"; message: string }
  | { type: "finish" };
