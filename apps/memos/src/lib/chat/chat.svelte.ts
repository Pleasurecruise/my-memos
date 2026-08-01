import { parseChatEvent } from "./protocol";
import type {
  AssistantChatMessage,
  ChatEvent,
  ChatMessage,
  ChatStatus,
  UserChatMessage,
} from "./types";

export class Chat {
  messages = $state<ChatMessage[]>([]);
  status = $state<ChatStatus>("ready");
  error = $state<Error>();

  async sendMessage(text: string) {
    if (this.status === "submitted" || this.status === "streaming" || !text.trim()) return;

    const user: UserChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text }],
    };
    this.messages.push(user);
    this.error = undefined;
    this.status = "submitted";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: this.messages }),
      });
      if (!response.ok) {
        throw new Error(`Chat request failed (${response.status}).`);
      }
      if (!response.body) throw new Error("Chat response has no body.");

      this.status = "streaming";
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let finished = false;
      let assistant: AssistantChatMessage | undefined;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line) continue;
          const event = parseChatEvent(line);
          finished ||= event.type === "finish";
          assistant = this.#apply(assistant, event);
        }
      }
      if (buffer.trim()) {
        const event = parseChatEvent(buffer);
        finished ||= event.type === "finish";
        assistant = this.#apply(assistant, event);
      }
      if (!finished) throw new Error("Chat stream ended unexpectedly.");
      this.status = "ready";
    } catch (error) {
      this.error = error instanceof Error ? error : new Error("Chat request failed.");
      this.status = "error";
    }
  }

  #apply(message: AssistantChatMessage | undefined, event: ChatEvent) {
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "assistant-step") {
      if (message) {
        message.steps.push({ parts: [] });
        return message;
      }
      const index =
        this.messages.push({
          id: crypto.randomUUID(),
          role: "assistant",
          steps: [{ parts: [] }],
        }) - 1;
      const assistant = this.messages[index];
      if (assistant.role !== "assistant") throw new Error("Assistant message was not created.");
      return assistant;
    }
    if (event.type === "finish") return message;
    if (!message) throw new Error("Chat event arrived before an assistant message started.");
    const parts = message.steps.at(-1)?.parts;
    if (!parts) throw new Error("Chat event arrived before an assistant step started.");
    if (event.type === "text-delta") {
      const last = parts.at(-1);
      if (last?.type === "text") last.text += event.delta;
      else parts.push({ type: "text", text: event.delta });
    }
    if (event.type === "tool-input") {
      const current = parts.find(
        (part) => part.type === "tool" && part.toolCallId === event.toolCallId,
      );
      if (current?.type === "tool" && current.state === "input-available") {
        current.toolName = event.toolName;
        current.input = event.input;
        return message;
      }
      parts.push({
        type: "tool",
        state: "input-available",
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        input: event.input,
      });
    }
    if (event.type === "tool-output" || event.type === "tool-error") {
      const index = parts.findIndex(
        (part) => part.type === "tool" && part.toolCallId === event.toolCallId,
      );
      const current = parts[index];
      if (!current || current.type !== "tool") return message;
      parts[index] =
        event.type === "tool-output"
          ? { ...current, state: "output-available", output: event.output }
          : { ...current, state: "output-error", errorText: event.errorText };
    }
    return message;
  }
}
