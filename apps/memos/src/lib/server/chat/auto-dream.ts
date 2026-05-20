import type { R2Bucket } from "@cloudflare/workers-types";
import { generateText, getToolName, isToolUIPart, type LanguageModel, type UIMessage } from "ai";

const MEMORY_KEY = "agent/MEMORY.md";

function formatMessage(message: UIMessage) {
  const parts = message.parts.flatMap((part) => {
    if (part.type === "text") return part.text.trim();
    if (!isToolUIPart(part)) return [];

    const lines = [`[tool:${getToolName(part)} state=${part.state}]`];
    if (part.input) lines.push(`input: ${JSON.stringify(part.input)}`);
    if (part.state === "output-available") lines.push(`output: ${JSON.stringify(part.output)}`);
    if (part.state === "output-error") lines.push(`error: ${part.errorText}`);
    return lines.join("\n");
  });

  return `${message.role.toUpperCase()}:\n${parts.filter(Boolean).join("\n\n")}`;
}

function buildPrompt(currentMemory: string, messages: UIMessage[]) {
  const conversation = messages.map(formatMessage).filter(Boolean).join("\n\n---\n\n");

  return `# Dream: Memory Consolidation

You are performing a dream — a reflective pass over the long-term memory file. Synthesize what you've learned from the recent conversation into durable, well-organized memories so that future sessions can orient quickly.

---

## Phase 1 — Orient

Below is the current memory file. Read it carefully.

<memory>
${currentMemory}
</memory>

Skim for:
- Facts that may now be outdated or contradicted by the conversation below
- Missing information the user clearly relies on
- Entries that are too verbose
- Near-duplicate information scattered across sections

## Phase 2 — Gather signal

Review the full conversation for durable signal.

<conversation>
${conversation}
</conversation>

In rough priority order:
1. **Explicit statements** — user preferences, identity facts, work habits, recurring projects, environment details
2. **Corrections** — the user corrected you or clarified something; fix old memory
3. **Drifted facts** — current memory contradicts what happened in the conversation
4. **"Remember" requests** — user explicitly asked to remember something

## Phase 3 — Consolidate

- **Merge, don't duplicate.** Weave new signal into existing sections rather than appending new ones.
- **Use absolute dates.** Convert "yesterday", "last week" to YYYY-MM-DD so they stay interpretable.
- **Delete contradicted facts.** If the conversation disproves an old entry, remove or correct it.
- **Keep it concise.** One line per fact when possible.

### What to record
- Stable user preferences (preferred tools, languages, workflows, communication style)
- Identity facts (name, role, projects)
- Recurring patterns (frequent tasks, common workflows)
- Environment details (repo structure, deployment targets, key config)
- Architectural decisions that survive across sessions
- Explicit "remember this" requests

### What NOT to record
- One-off tasks, transient debugging, temporary questions
- Search results, guesses, or uncertain conclusions
- Sensitive info unless user explicitly asked to remember it
- Details already captured verbatim in current memory
- Ordinary chitchat or session-specific state

## Output

Output ONLY the complete revised memory markdown — nothing else. If nothing changed, output the current memory as-is.`;
}

export async function executeAutoDream({
  bucket,
  model,
  currentMemory,
  messages,
}: {
  bucket: R2Bucket;
  model: LanguageModel;
  currentMemory: string;
  messages: UIMessage[];
}) {
  const prompt = buildPrompt(currentMemory, messages);

  const { text } = await generateText({
    model,
    prompt,
  });

  await bucket.put(MEMORY_KEY, text.trim(), {
    httpMetadata: { contentType: "text/markdown; charset=utf-8" },
  });
}
