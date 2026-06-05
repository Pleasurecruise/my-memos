<script lang="ts">
  import MermaidRenderer from "./MermaidRenderer.svelte";
  import SvgRenderer from "./SvgRenderer.svelte";
  import VisualFrame from "./VisualFrame.svelte";
  import type { VisualBlock } from "$lib/types";

  interface Props {
    block: VisualBlock;
  }

  let { block }: Props = $props();

  function resolveTitle(block: VisualBlock): string {
    switch (block.type) {
      case "chart":
        return "Chart";
      case "svg":
      case "mermaid":
        return "Diagram";
      case "widget":
        return "Widget";
      default:
        return "Visual";
    }
  }

  const title = $derived(resolveTitle(block));
</script>

<div class="article-visual">
  <p class="article-visual-title">{title}</p>
  {#if block.type === "chart"}
    <VisualFrame code={block.code} {title} streaming={false} width={720} height={360} />
  {:else if block.type === "svg"}
    <SvgRenderer code={block.code} {title} />
  {:else if block.type === "mermaid"}
    <MermaidRenderer code={block.code} {title} />
  {:else if block.type === "widget"}
    <VisualFrame code={block.code} {title} streaming={false} width={800} height={500} />
  {/if}
</div>

<style>
  .article-visual {
    margin: 1.75rem 0;
    width: 100%;
    min-width: 0;
    overflow-x: auto;
    border-top: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
    padding: 1rem 0;
  }

  .article-visual-title {
    margin: 0 0 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    line-height: 1.4;
    color: var(--color-muted-foreground);
    text-transform: uppercase;
  }
</style>
