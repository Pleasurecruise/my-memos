import type { AgentEvent, AgentMessage, AgentTool } from "@earendil-works/pi-agent-core";
import type { Model, ProviderHeaders } from "@earendil-works/pi-ai";
import type { Client } from "@modelcontextprotocol/client";

export type McpFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type McpToolClient = Pick<Client, "callTool">;

export interface OpenAICompatibleModelOptions {
  id: string;
  provider?: string;
  name?: string;
  baseUrl: string;
  contextWindow?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
}

export interface RunAgentOptions {
  systemPrompt: string;
  model: Model<"openai-completions">;
  messages: AgentMessage[];
  tools: AgentTool[];
  apiKey?: string;
  headers?: ProviderHeaders;
  signal?: AbortSignal;
  onEvent?: (event: AgentEvent) => void | Promise<void>;
}

export interface McpConnection {
  client: Client;
  tools: AgentTool[];
  close(): Promise<void>;
}

export interface ConnectMcpOptions {
  url: string | URL;
  fetch: McpFetch;
  headers?: HeadersInit;
}
