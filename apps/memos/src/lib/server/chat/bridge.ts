import type {
  AgentEvent,
  AgentMessage,
  AssistantMessage,
  ToolResultMessage,
} from "@my-memos/ai-core";
import type { ChatEvent, ChatMessage } from "$lib/chat/types";
import { messageText } from "./utils";

const EMPTY_USAGE = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

export function uiMessagesToPi(messages: ChatMessage[], modelId: string): AgentMessage[] {
  const converted: AgentMessage[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      converted.push({ role: "user", content: messageText(message), timestamp: Date.now() });
      continue;
    }
    if (message.role !== "assistant") continue;

    for (const step of message.steps) {
      const content: AssistantMessage["content"] = [];
      const results: ToolResultMessage[] = [];
      for (const part of step.parts) {
        if (part.type === "text" && part.text) content.push({ type: "text", text: part.text });
        if (part.type !== "tool" || part.state === "input-available") continue;
        content.push({
          type: "toolCall",
          id: part.toolCallId,
          name: part.toolName,
          arguments: part.input ?? {},
        });
        const output = part.state === "output-available" ? part.output : part.errorText;
        const outputText = typeof output === "string" ? output : (JSON.stringify(output) ?? "");
        results.push({
          role: "toolResult",
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          content: [{ type: "text", text: outputText }],
          details: part.state === "output-available" ? part.output : undefined,
          isError: part.state === "output-error",
          timestamp: Date.now(),
        });
      }
      if (!content.length) continue;
      converted.push({
        role: "assistant",
        content,
        api: "openai-completions",
        provider: "cloudflare-ai-gateway",
        model: modelId,
        usage: EMPTY_USAGE,
        stopReason: results.length ? "toolUse" : "stop",
        timestamp: Date.now(),
      });
      converted.push(...results);
    }
  }
  return converted;
}

export class AgentChatStreamBridge {
  constructor(private readonly writeEvent: (event: ChatEvent) => void) {}

  write(event: AgentEvent) {
    if (event.type === "message_start" && event.message.role === "assistant") {
      this.writeEvent({ type: "assistant-step" });
    }
    if (event.type === "message_update") {
      const update = event.assistantMessageEvent;
      if (update.type === "text_delta") {
        this.writeEvent({ type: "text-delta", delta: update.delta });
      }
    }

    if (event.type === "tool_execution_start") {
      this.writeEvent({
        type: "tool-input",
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        input: event.args,
      });
    }
    if (event.type === "tool_execution_end") {
      this.writeEvent(
        event.isError
          ? {
              type: "tool-error",
              toolCallId: event.toolCallId,
              errorText: event.result?.content?.[0]?.text ?? "Tool failed.",
            }
          : {
              type: "tool-output",
              toolCallId: event.toolCallId,
              output: event.result?.details ?? event.result,
            },
      );
    }
  }
}
