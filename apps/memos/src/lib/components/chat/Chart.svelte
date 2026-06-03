<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "@my-memos/ui";
  import {
    renderChartSchema,
    type RenderChartPayload,
    type RenderChartSpec,
  } from "$lib/chat/chart";
  import Frame from "./Frame.svelte";

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
  const chartCode = $derived(parsed.value?.code);
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

{#if parsed.value}
  <div class="w-full max-w-[760px]">
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Frame
          {title}
          code={chartCode}
          {streaming}
          width={parsed.value.width ?? 720}
          height={parsed.value.height ?? 360}
        />
      </CardContent>
    </Card>
  </div>
{:else}
  <div class="w-full max-w-[760px]">
    <Card class="border-destructive/30 bg-destructive/5">
      <CardHeader><CardTitle class="text-sm font-medium">{title}</CardTitle></CardHeader>
      <CardContent><p class="text-xs text-muted-foreground">{parsed.error}</p></CardContent>
    </Card>
  </div>
{/if}
