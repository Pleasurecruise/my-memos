<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "@my-memos/ui";
  import {
    renderChartSchema,
    type RenderChartPayload,
    type RenderChartSpec,
  } from "$lib/visual/chart";
  import { ChartRenderer } from "$lib/components/visual";

  interface ChartParseResult {
    value: RenderChartSpec | null;
    error: string;
    partialTitle?: string;
  }

  interface Props {
    spec: RenderChartPayload;
    streaming: boolean;
  }

  let { spec, streaming }: Props = $props();

  const parsed = $derived(parseSpec(spec));
  const title = $derived(
    parsed.value?.title ?? parsed.partialTitle ?? (streaming ? "Generating chart" : "Chart"),
  );

  function parseSpec(value: RenderChartPayload): ChartParseResult {
    if (streaming && value === null) return { value: null, error: "Generating chart..." };
    const result = renderChartSchema.safeParse(value);
    if (!result.success) {
      if (streaming) {
        const partial = renderChartSchema.partial().safeParse(value);
        return { value: null, error: "Generating chart...", partialTitle: partial.data?.title };
      }
      return { value: null, error: result.error.issues[0]?.message ?? "Invalid chart spec." };
    }
    if (!result.data.code.trim()) return { value: null, error: "Chart code must not be empty." };
    return { value: result.data, error: "" };
  }
</script>

<div class="w-full max-w-[760px]">
  <Card class={parsed.value ? "" : "border-destructive/30 bg-destructive/5"}>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {#if parsed.value}
        <ChartRenderer
          code={parsed.value.code}
          {title}
          {streaming}
          width={parsed.value.width ?? 720}
          height={parsed.value.height ?? 360}
        />
      {:else}
        <p class="text-xs text-muted-foreground">{parsed.error}</p>
      {/if}
    </CardContent>
  </Card>
</div>
