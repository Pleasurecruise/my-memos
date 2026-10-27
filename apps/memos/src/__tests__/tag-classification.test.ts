import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { classifyMemo, type TagDefinition } from "#lib/server/tags/index.ts";

const run = vi.hoisted(() => vi.fn());
vi.mock("void/ai", () => ({ ai: { run } }));

const definitions: TagDefinition[] = [
  { name: "思考", kind: "type", description: "A reflection" },
  { name: "日常", kind: "type", description: "An everyday moment" },
  { name: "ai", kind: "topic", description: "artificial intelligence" },
  { name: "英国", kind: "topic", description: "life in the United Kingdom" },
  { name: "工作", kind: "topic", description: "jobs or the workplace" },
  { name: "twitter", kind: "channel", description: "Posted on Twitter" },
];

describe("Jev memo classification", () => {
  beforeEach(() => run.mockReset());

  it("asks the defined types as one choice and each topic as a yes/no, keeping the two likeliest", async () => {
    run.mockResolvedValue({
      state: "Completed",
      result: {
        model: "jev-1.13.0",
        answers: {
          type: { type: "choice", choice: "思考", confidence: 0.8 },
          t0: { type: "noul", noul: 0.9 },
          t1: { type: "noul", noul: 0.2 },
          t2: { type: "noul", noul: 0.6 },
        },
        usage: { input_tokens: 300, output_tokens: 14 },
      },
    });

    const tags = await classifyMemo("vibe coding 让人上瘾", definitions);

    expect(tags).toEqual(["思考", "ai", "工作"]);
    const [model, input, options] = run.mock.calls[0];
    expect(model).toBe("typesafe/jev");
    expect(options).toEqual({ gateway: { id: "default" } });
    expect(input.state).toEqual({ memo: "vibe coding 让人上瘾" });
    expect(input.questions.type.criteria).toEqual({
      思考: "A reflection",
      日常: "An everyday moment",
    });
    expect(input.questions.t0.instructions).toBe("Is `memo` about artificial intelligence?");
    expect(Object.keys(input.questions)).toEqual(["type", "t0", "t1", "t2"]);
  });

  it("rejects a reply that leaves a topic unanswered", async () => {
    run.mockResolvedValue({
      result: { answers: { type: { type: "choice", choice: "日常" } } },
    });

    await expect(classifyMemo("今天去了咖啡店", definitions)).rejects.toThrow(
      'Jev left topic "ai" unanswered.',
    );
  });
});
