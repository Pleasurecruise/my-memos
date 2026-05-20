<script module lang="ts">
  export const title = "Collapsible";
</script>

<script lang="ts">
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../src";
  import DemoPage from "../DemoPage.svelte";
  import SectionLabel from "../SectionLabel.svelte";

  const propDefs = [
    {
      name: "open",
      type: "boolean",
      default: "false",
      description: "Controls content visibility. Supports bind:open on Collapsible.",
    },
    {
      name: "children",
      type: "Snippet",
      description: "Composition slot for trigger and content.",
    },
  ];

  const usage = `import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from "@my-memos/ui";

<Collapsible bind:open={open}>
  <CollapsibleTrigger class="tool-line">
    <ChevronRight />
    Ran search_memos
  </CollapsibleTrigger>
  <CollapsibleContent class="tool-details">
    <pre>{JSON.stringify(args, null, 2)}</pre>
  </CollapsibleContent>
</Collapsible>`;

  let toolOpen = $state(true);
  let webOpen = $state(false);

  const toolInput = `{
  "query": "recent memos about agent loops",
  "from_date": "2026-05-01",
  "to_date": "2026-05-20",
  "tags": ["agent", "notes"]
}`;

  const toolResult = `id: memo_20260518_0914
[2026-05-18] tags: agent, notes
Loop-based agents should stop on completion signals and hard step limits.`;
</script>

<DemoPage {propDefs} {usage}>
  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Codex-style Tool Fold</SectionLabel>
    <div
      style="
        max-width: 720px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        color: var(--color-foreground);
      "
    >
      <p class="assistant-line">我先搜索相关 memo，然后根据结果继续整理。</p>

      <Collapsible bind:open={toolOpen}>
        <CollapsibleTrigger class="tool-line" aria-label="Toggle search_memos tool parameters">
          <ChevronRight
            size={14}
            class="tool-chevron"
            style={`transform: ${toolOpen ? "rotate(90deg)" : "rotate(0deg)"}`}
          />
          <span>Ran</span>
          <code>search_memos</code>
          <span class="tool-meta">4 args · 1 result</span>
        </CollapsibleTrigger>

        <CollapsibleContent class="tool-details">
          <div class="detail-block">
            <span>arguments</span>
            <pre>{toolInput}</pre>
          </div>
          <div class="detail-block">
            <span>result</span>
            <pre>{toolResult}</pre>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible bind:open={webOpen}>
        <CollapsibleTrigger class="tool-line" aria-label="Toggle web_search tool parameters">
          <ChevronRight
            size={14}
            class="tool-chevron"
            style={`transform: ${webOpen ? "rotate(90deg)" : "rotate(0deg)"}`}
          />
          <span>Called</span>
          <code>web_search</code>
          <span class="tool-meta">query · skipped result preview</span>
        </CollapsibleTrigger>

        <CollapsibleContent class="tool-details">
          <div class="detail-block">
            <span>arguments</span>
            <pre>{`{
  "query": "AI SDK stopWhen stepCountIs tool loop",
  "max_results": 3
}`}</pre>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <p class="assistant-line">找到一条匹配 memo，并补充了当前文档里的 tool loop 语义。</p>
    </div>
  </section>

  <section style="display: flex; flex-direction: column; gap: 12px;">
    <SectionLabel>Controlled State</SectionLabel>
    <div style="display: flex; align-items: center; gap: 12px;">
      <Button variant="outline" size="sm" onclick={() => (toolOpen = !toolOpen)}>
        Toggle first tool
      </Button>
      <span style="font-size: 13px; color: var(--color-muted-foreground);">
        <code>search_memos</code> is currently {toolOpen ? "open" : "closed"}.
      </span>
    </div>
  </section>
</DemoPage>

<style>
  .assistant-line {
    max-width: 560px;
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--color-foreground);
  }

  :global(.tool-line) {
    width: fit-content;
    max-width: 100%;
    padding: 1px 2px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-muted-foreground);
  }

  :global(.tool-line:hover) {
    color: var(--color-foreground);
    background: var(--color-muted);
  }

  :global(.tool-line code) {
    color: var(--color-foreground);
    font-family: var(--font-mono);
    font-size: 12px;
  }

  :global(.tool-chevron) {
    flex: 0 0 auto;
    transition: transform 150ms ease;
  }

  :global(.tool-meta) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.tool-details) {
    margin: 6px 0 2px 20px;
    padding-left: 12px;
    border-left: 1px solid var(--color-border);
  }

  .detail-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
  }

  .detail-block:last-child {
    margin-bottom: 0;
  }

  .detail-block span {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-muted-foreground);
    text-transform: uppercase;
  }

  .detail-block pre {
    max-width: 640px;
    margin: 0;
    overflow-x: auto;
    border-radius: 4px;
    background: var(--color-muted);
    padding: 10px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.55;
    color: var(--color-foreground);
  }
</style>
