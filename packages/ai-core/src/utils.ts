import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import type { ImageContent, TextContent } from "@earendil-works/pi-ai";
import type { CallToolResult } from "@modelcontextprotocol/client";

function stringify(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function toAgentToolResult(result: CallToolResult): AgentToolResult<unknown> {
  const content: (TextContent | ImageContent)[] = result.content.map((part) => {
    if (part.type === "text") return { type: "text", text: part.text };
    if (part.type === "image") {
      return { type: "image", data: part.data, mimeType: part.mimeType };
    }
    return { type: "text", text: stringify(part) };
  });

  if (!content.length && result.structuredContent !== undefined) {
    content.push({ type: "text", text: stringify(result.structuredContent) });
  }
  return { content, details: result.structuredContent };
}
