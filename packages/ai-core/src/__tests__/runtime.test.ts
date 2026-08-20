import type { AgentMessage, StreamFn } from "@earendil-works/pi-agent-core";
import { beforeEach, describe, expect, it, vi, type Mock } from "vite-plus/test";

const agentMock = vi.hoisted(() => ({
  instances: [] as Array<{
    options: Record<string, unknown>;
    abort: Mock;
    state: { messages: unknown[]; errorMessage?: string };
  }>,
  nextError: undefined as string | undefined,
}));

vi.mock("@earendil-works/pi-agent-core", () => ({
  Agent: class {
    options: Record<string, unknown>;
    abort = vi.fn();
    subscribe = vi.fn();
    continue = vi.fn().mockResolvedValue(undefined);
    state: { messages: unknown[]; errorMessage?: string };

    constructor(options: Record<string, unknown>) {
      this.options = options;
      const initialState = options.initialState as { messages: unknown[] };
      this.state = { messages: initialState.messages, errorMessage: agentMock.nextError };
      agentMock.instances.push(this);
    }
  },
}));

vi.mock("@earendil-works/pi-ai/api/openai-completions", () => ({ streamSimple: vi.fn() }));

import { runAgent } from "../runtime";
import { createOpenAICompatibleModel } from "../model";
import type { RunAgentOptions } from "../types";
import { streamSimple } from "@earendil-works/pi-ai/api/openai-completions";

const messages: AgentMessage[] = [{ role: "user", content: "hello", timestamp: 1 }];
const options: RunAgentOptions = {
  systemPrompt: "system",
  model: createOpenAICompatibleModel({ id: "model", baseUrl: "https://example.test/v1" }),
  messages,
  tools: [],
  apiKey: "key",
};

describe("pi Agent runtime", () => {
  beforeEach(() => {
    agentMock.instances.length = 0;
    agentMock.nextError = undefined;
    vi.clearAllMocks();
  });

  it("does not install application turn or tool budgets", async () => {
    await runAgent(options);

    const configuration = agentMock.instances[0].options;
    expect(configuration).toEqual(
      expect.objectContaining({ toolExecution: "parallel", initialState: expect.any(Object) }),
    );
    expect(configuration).not.toHaveProperty("shouldStopAfterTurn");
    expect(configuration).not.toHaveProperty("maxTurns");
    expect(configuration).not.toHaveProperty("maxToolCalls");
  });

  it("propagates an already-aborted request to the Agent", async () => {
    const controller = new AbortController();
    controller.abort(new Error("client disconnected"));

    await expect(runAgent({ ...options, signal: controller.signal })).rejects.toThrow(
      "client disconnected",
    );
    expect(agentMock.instances[0].abort).toHaveBeenCalledOnce();
  });

  it("turns a provider terminal error into a failed run", async () => {
    agentMock.nextError = "provider failed";

    await expect(runAgent(options)).rejects.toThrow("provider failed");
  });

  it("passes gateway-only authentication headers to pi-ai", async () => {
    const headers = {
      "cf-aig-authorization": "Bearer gateway-token",
      Authorization: null,
    };
    await runAgent({ ...options, apiKey: undefined, headers });

    const stream = agentMock.instances[0].options.streamFn as StreamFn;
    stream(options.model, { systemPrompt: "system", messages: [], tools: [] }, {});

    expect(streamSimple).toHaveBeenCalledWith(
      options.model,
      expect.any(Object),
      expect.objectContaining({ headers }),
    );
    expect(agentMock.instances[0].options.getApiKey).toBeUndefined();
  });
});
