<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "@my-memos/ui";
  import {
    renderWidgetSchema,
    type RenderWidgetPayload,
    type RenderWidgetSpec,
  } from "$lib/visual/widget";
  import { WidgetRenderer } from "$lib/components/visual";

  interface WidgetParseResult {
    value: RenderWidgetSpec | null;
    error: string;
    partialTitle?: string;
  }

  interface Props {
    spec: RenderWidgetPayload;
    streaming: boolean;
  }

  let { spec, streaming }: Props = $props();

  const parsed = $derived(parseSpec(spec));
  const title = $derived(
    parsed.value?.title?.replace(/_/g, " ") ??
      parsed.partialTitle?.replace(/_/g, " ") ??
      (streaming ? "Generating widget" : "Widget"),
  );

  function parseSpec(value: RenderWidgetPayload): WidgetParseResult {
    if (streaming && value === null) return { value: null, error: "Generating widget..." };
    const result = renderWidgetSchema.safeParse(value);
    if (!result.success) {
      if (streaming) {
        const partial = renderWidgetSchema.partial().safeParse(value);
        return { value: null, error: "Generating widget...", partialTitle: partial.data?.title };
      }
      return { value: null, error: result.error.issues[0]?.message ?? "Invalid widget spec." };
    }
    if (!result.data.code.trim()) return { value: null, error: "Widget code must not be empty." };
    return { value: result.data, error: "" };
  }
</script>

<div class="w-full max-w-215">
  <Card class={parsed.value ? "" : "border-destructive/30 bg-destructive/5"}>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {#if parsed.value}
        <WidgetRenderer
          code={parsed.value.code}
          {title}
          {streaming}
          width={parsed.value.width ?? 800}
          height={parsed.value.height ?? 500}
        />
      {:else}
        <p class="text-xs text-muted-foreground">{parsed.error}</p>
      {/if}
    </CardContent>
  </Card>
</div>
