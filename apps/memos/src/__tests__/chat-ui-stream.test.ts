import type { AgentEvent, AssistantMessage } from "@my-memos/ai-core";
import { describe, expect, it, vi } from "vitest";
import { AgentChatStreamBridge } from "$lib/server/chat/bridge";

const ASSISTANT_MESSAGE = {
  role: "assistant",
  content: [],
  api: "openai-completions",
  provider: "test",
  model: "test",
  usage: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  },
  stopReason: "pending",
  timestamp: 0,
} satisfies AssistantMessage;

describe("pi to UI message stream bridge", () => {
  it("streams text deltas across agent turns", () => {
    const write = vi.fn();
    const bridge = new AgentChatStreamBridge(write);
    const assistantStart = {
      type: "message_start",
      message: ASSISTANT_MESSAGE,
    } satisfies AgentEvent;

    bridge.write(assistantStart);
    bridge.write({
      type: "message_update",
      message: ASSISTANT_MESSAGE,
      assistantMessageEvent: {
        type: "text_delta",
        contentIndex: 0,
        delta: "first",
        partial: ASSISTANT_MESSAGE,
      },
    });
    bridge.write(assistantStart);

    expect(write.mock.calls.map(([event]) => event)).toEqual([
      { type: "assistant-step" },
      { type: "text-delta", delta: "first" },
      { type: "assistant-step" },
    ]);
    expect(bridge.assistantText).toBe("first");
  });

  it("maps tool starts, results, and errors to dynamic UI parts", () => {
    const write = vi.fn();
    const bridge = new AgentChatStreamBridge(write);
    const toolMessage = {
      ...ASSISTANT_MESSAGE,
      content: [
        {
          type: "toolCall",
          id: "call-1",
          name: "render_chart",
          arguments: { title: "Chart", code: "<div>" },
        },
      ],
    } satisfies AssistantMessage;

    bridge.write({
      type: "message_update",
      message: toolMessage,
      assistantMessageEvent: {
        type: "toolcall_delta",
        contentIndex: 0,
        delta: "partial",
        partial: toolMessage,
      },
    });
    bridge.write({
      type: "tool_execution_start",
      toolCallId: "call-1",
      toolName: "render_chart",
      args: { title: "Chart" },
    });
    bridge.write({
      type: "tool_execution_end",
      toolCallId: "call-1",
      toolName: "render_chart",
      result: { details: { title: "Chart" } },
      isError: false,
    });
    bridge.write({
      type: "tool_execution_end",
      toolCallId: "call-2",
      toolName: "fetch_url",
      result: { content: [{ type: "text", text: "timeout" }] },
      isError: true,
    });

    expect(write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "tool-input",
        toolName: "render_chart",
        input: { title: "Chart", code: "<div>" },
      }),
    );
    expect(write).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: "tool-input", toolName: "render_chart" }),
    );
    expect(write).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ type: "tool-output", output: { title: "Chart" } }),
    );
    expect(write).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({ type: "tool-error", errorText: "timeout" }),
    );
  });
});
