import env from "#env";
import { z } from "zod";
import { memoTitle } from "#lib/server/discovery/index.ts";
import type { Memo } from "#lib/types.ts";

const triageSchema = z.object({ should_distill: z.boolean() });
const scheduleSchema = z.object({ enqueued: z.boolean(), message: z.string() });

export async function importMemoThread(memo: Memo): Promise<void> {
  const threadId = `my-memos-${memo.id}`;
  const title = memoTitle(memo.content);
  const headers = {
    Authorization: `Bearer ${env.NMEM_API_KEY}`,
    "Content-Type": "application/json",
  };

  const thread = await fetch(`${env.NMEM_API_URL}/threads`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      thread_id: threadId,
      title,
      messages: [{ role: "user", content: memo.content }],
      source: "my-memos",
    }),
  });
  if (!thread.ok) {
    throw new Error(
      `Nowledge Mem rejected thread ${threadId}: ${thread.status} ${await thread.text()}`,
    );
  }

  const triage = await fetch(`${env.NMEM_API_URL}/memories/distill/triage`, {
    method: "POST",
    headers,
    body: JSON.stringify({ thread_content: `user: ${memo.content}` }),
  });
  if (!triage.ok) {
    throw new Error(
      `Nowledge Mem triage failed for ${threadId}: ${triage.status} ${await triage.text()}`,
    );
  }
  if (!triageSchema.parse(await triage.json()).should_distill) return;

  const schedule = await fetch(`${env.NMEM_API_URL}/memories/distill/schedule`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      thread_id: threadId,
      thread_title: title,
      distillation_type: "simple_llm",
    }),
  });
  if (!schedule.ok) {
    throw new Error(
      `Nowledge Mem distillation failed for ${threadId}: ${schedule.status} ${await schedule.text()}`,
    );
  }
  const scheduled = scheduleSchema.parse(await schedule.json());
  if (!scheduled.enqueued) {
    throw new Error(`Nowledge Mem did not schedule ${threadId}: ${scheduled.message}`);
  }
}
