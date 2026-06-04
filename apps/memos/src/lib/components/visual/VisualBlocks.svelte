<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "@my-memos/ui";
  import { ChartRenderer, SvgRenderer, WidgetRenderer } from "$lib/components/visual";
  import type { VisualBlock } from "$lib/types";

  interface Props {
    blocks: VisualBlock[];
  }

  let { blocks }: Props = $props();

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
</script>

{#each blocks as block, i (i)}
  {@const title = resolveTitle(block)}
  <div class="my-6">
    {#if block.type === "chart"}
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartRenderer code={block.code} {title} streaming={false} />
        </CardContent>
      </Card>
    {:else if block.type === "svg" || block.type === "mermaid"}
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <SvgRenderer
            code={block.code}
            format={block.type === "mermaid" ? "mermaid" : "svg"}
            {title}
          />
        </CardContent>
      </Card>
    {:else if block.type === "widget"}
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <WidgetRenderer code={block.code} {title} streaming={false} />
        </CardContent>
      </Card>
    {/if}
  </div>
{/each}
