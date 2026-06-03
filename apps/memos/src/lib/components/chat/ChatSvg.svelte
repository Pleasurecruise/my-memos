<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "@my-memos/ui";
  import {
    partialRenderSvgSchema,
    renderSvgSchema,
    type RenderSvgPayload,
    type RenderSvgSpec,
  } from "$lib/visual/svg";
  import { SvgRenderer } from "$lib/components/visual";

  interface SvgParseResult {
    value: RenderSvgSpec | null;
    error: string;
    partialTitle?: string;
  }

  interface Props {
    spec: RenderSvgPayload;
    streaming: boolean;
  }

  let { spec, streaming }: Props = $props();

  const parsed = $derived(parseVisualSpec(spec));
  const title = $derived(
    parsed.value?.title ?? parsed.partialTitle ?? (streaming ? "Generating visual" : "Diagram"),
  );

  function parseVisualSpec(value: RenderSvgPayload): SvgParseResult {
    if (streaming && value === null) return { value: null, error: "Generating visual..." };
    const result = renderSvgSchema.safeParse(value);
    if (!result.success) {
      if (streaming) {
        const partial = partialRenderSvgSchema.safeParse(value);
        return { value: null, error: "Generating visual...", partialTitle: partial.data?.title };
      }
      return { value: null, error: result.error.issues[0]?.message ?? "Invalid visual spec." };
    }
    if (result.data.format === "svg" && !result.data.code.trimStart().startsWith("<svg")) {
      return { value: null, error: "SVG visuals must start with an <svg> element." };
    }
    return { value: result.data, error: "" };
  }
</script>

<div class="w-full max-w-190">
  <Card class={parsed.value ? "" : "border-destructive/30 bg-destructive/5"}>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {#if parsed.value}
        <SvgRenderer
          code={parsed.value.code}
          format={parsed.value.format}
          {title}
          caption={parsed.value.caption}
        />
      {:else}
        <p class="text-xs text-muted-foreground">{parsed.error}</p>
      {/if}
    </CardContent>
  </Card>
</div>
