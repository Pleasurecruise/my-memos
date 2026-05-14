import { AIChatAgent } from "@cloudflare/ai-chat";
import { createWorkersAI } from "workers-ai-provider";
import { streamText, convertToModelMessages } from "ai";
import type { D1Database, KVNamespace, R2Bucket, Ai } from "@cloudflare/workers-types";

interface Env {
  AI: Ai;
  DB: D1Database;
  MEMOS_BUCKET: R2Bucket;
  MEMOS_CACHE: KVNamespace;
}

export class ChatAgent extends AIChatAgent<Env> {
  declare env: Env;

  async onChatMessage() {
    const workersai = createWorkersAI({ binding: this.env.AI });
    const result = streamText({
      model: workersai("@cf/meta/llama-4-scout-17b-16e-instruct"),
      system: "You are a helpful personal assistant.",
      messages: await convertToModelMessages(this.messages),
    });
    return result.toUIMessageStreamResponse();
  }
}
