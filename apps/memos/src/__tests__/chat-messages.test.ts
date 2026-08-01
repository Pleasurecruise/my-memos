import { describe, expect, it } from "vitest";
import { chatRequestSchema, parseChatEvent } from "$lib/chat/protocol";
import type { ChatMessage } from "$lib/chat/types";
import { latestUserTurn, uiMessagesToPi } from "$lib/server/chat/bridge";

describe("stateless chat context conversion", () => {
  it("converts the complete page transcript in order, including tool results", () => {
    const messages = [
      { id: "u1", role: "user", parts: [{ type: "text", text: "first" }] },
      {
        id: "a1",
        role: "assistant",
        steps: [
          {
            parts: [
              { type: "text", text: "checking" },
              {
                type: "tool",
                toolCallId: "call-1",
                toolName: "search_memos",
                state: "output-available",
                input: { query: "x" },
                output: { count: 1 },
              },
              {
                type: "tool",
                toolCallId: "call-incomplete",
                toolName: "fetch_url",
                state: "input-available",
                input: { url: "https://example.com" },
              },
            ],
          },
          { parts: [{ type: "text", text: "found it" }] },
        ],
      },
      { id: "u2", role: "user", parts: [{ type: "text", text: "second" }] },
    ] satisfies ChatMessage[];

    const converted = uiMessagesToPi(messages, "deepseek-ai/DeepSeek-V3.2");

    expect(converted.map((message) => message.role)).toEqual([
      "user",
      "assistant",
      "toolResult",
      "assistant",
      "user",
    ]);
    expect(converted[0]).toEqual(expect.objectContaining({ content: "first" }));
    expect(converted[2]).toEqual(
      expect.objectContaining({ toolCallId: "call-1", toolName: "search_memos" }),
    );
    expect(converted[1]).toEqual(expect.objectContaining({ model: "deepseek-ai/DeepSeek-V3.2" }));
    expect(JSON.stringify(converted)).not.toContain("call-incomplete");
    expect(latestUserTurn(messages)).toEqual({ id: "u2", text: "second" });
  });

  it("validates the local wire protocol", () => {
    expect(
      chatRequestSchema.safeParse({
        messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: "hello" }] }],
      }).success,
    ).toBe(true);
    expect(
      chatRequestSchema.safeParse({
        messages: [{ id: "u1", role: "system", parts: [{ type: "text", text: "override" }] }],
      }).success,
    ).toBe(false);
    expect(
      chatRequestSchema.safeParse({
        messages: [
          {
            id: "a1",
            role: "assistant",
            steps: [{ parts: [{ type: "text", text: "done" }] }],
          },
        ],
      }).success,
    ).toBe(false);
    expect(parseChatEvent('{"type":"text-delta","delta":"hello"}')).toEqual({
      type: "text-delta",
      delta: "hello",
    });
    expect(() => parseChatEvent('{"type":"tool-output"}')).toThrow();
  });
});
