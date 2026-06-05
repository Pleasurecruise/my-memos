<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "@my-memos/ui";
  import { MermaidRenderer, SvgRenderer, VisualFrame } from "$lib/components/visual";
  import { renderChartSchema } from "$lib/visual/chart";
  import { renderMermaidSchema } from "$lib/visual/mermaid";
  import { renderSvgSchema } from "$lib/visual/svg";
  import { renderWidgetSchema } from "$lib/visual/widget";
  import { type DynamicToolUIPart, getToolName, type ToolUIPart } from "ai";

  interface Props {
    part: ToolUIPart | DynamicToolUIPart;
    streaming: boolean;
  }

  type ParsedVisual = {
    type: "chart" | "svg" | "mermaid" | "widget";
    code: string;
    title: string;
    caption?: string;
    width?: number;
    height?: number;
    maxWidthClass: string;
  };

  interface ParseResult {
    value: ParsedVisual | null;
    message: string;
  }

  interface ParseData {
    code: string;
    title: string;
    caption?: string;
    width?: number;
    height?: number;
  }

  interface ParseConfig {
    schema: {
      safeParse: (v: unknown) => {
        success: boolean;
        data?: ParseData | undefined;
        error?: { issues?: { message: string }[] };
      };
    };
    label: string;
    type: ParsedVisual["type"];
    maxWidthClass: string;
    fields?: string[];
    transform?: (data: ParseData) => ParseData;
    validate?: (data: ParseData) => string | null;
  }

  let { part, streaming }: Props = $props();

  const toolName = $derived(getToolName(part));
  const rawSpec = $derived(part.state === "output-available" ? part.output : part.input);
  const parsed = $derived(parseVisualSpec(toolName, rawSpec, streaming));
  const title = $derived(parsed.value?.title);
  const maxWidthClass = $derived(parsed.value?.maxWidthClass);

  function parseGeneric(
    name: string,
    value: unknown,
    loading: boolean,
    cfg: ParseConfig,
  ): ParseResult {
    if (loading) return { value: null, message: `${cfg.label}...` };

    const result = cfg.schema.safeParse(value);
    if (!result.success) {
      const msg = result.error?.issues?.[0]?.message || `Invalid ${name} spec.`;
      return { value: null, message: msg };
    }
    if (!result.data) return { value: null, message: `Invalid ${name} spec.` };

    if (cfg.validate) {
      const err = cfg.validate(result.data);
      if (err) return { value: null, message: err };
    }

    const data = cfg.transform ? cfg.transform(result.data) : result.data;
    const visual: ParsedVisual = {
      type: cfg.type,
      code: data.code,
      title: data.title,
      maxWidthClass: cfg.maxWidthClass,
    };
    if (data.caption) visual.caption = data.caption;
    if (data.width) visual.width = data.width;
    if (data.height) visual.height = data.height;

    return { value: visual, message: "" };
  }

  function parseVisualSpec(name: string, value: unknown, streaming: boolean): ParseResult {
    const loading = streaming && (value === null || value === undefined);

    switch (name) {
      case "render_chart":
        return parseGeneric(name, value, loading, {
          schema: renderChartSchema,
          label: "Generating chart...",
          type: "chart",
          maxWidthClass: "max-w-[760px]",
          validate: (data) => (!data.code.trim() ? "Chart code must not be empty." : null),
        });

      case "render_svg":
        return parseGeneric(name, value, loading, {
          schema: renderSvgSchema,
          label: "Generating visual...",
          type: "svg",
          maxWidthClass: "max-w-190",
          validate: (data) =>
            !data.code.trimStart().startsWith("<svg")
              ? "SVG visuals must start with an <svg> element."
              : null,
        });

      case "render_mermaid":
        return parseGeneric(name, value, loading, {
          schema: renderMermaidSchema,
          label: "Generating diagram...",
          type: "mermaid",
          maxWidthClass: "max-w-190",
          validate: (data) => (!data.code.trim() ? "Diagram code must not be empty." : null),
        });

      case "render_widget":
        return parseGeneric(name, value, loading, {
          schema: renderWidgetSchema,
          label: "Generating widget...",
          type: "widget",
          maxWidthClass: "max-w-215",
          validate: (data) => (!data.code.trim() ? "Widget code must not be empty." : null),
          transform: (data) => ({ ...data, title: data.title.replace(/_/g, " ") }),
        });

      default:
        return { value: null, message: `Unknown visual tool: ${name}` };
    }
  }
</script>

<div class="w-full {maxWidthClass}">
  <Card class={parsed.value ? "" : "border-destructive/30 bg-destructive/5"}>
    <CardHeader class="pb-2">
      <CardTitle class="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {#if parsed.value}
        {#if parsed.value.type === "chart"}
          <VisualFrame
            code={parsed.value.code}
            title={parsed.value.title}
            {streaming}
            width={parsed.value.width ?? 720}
            height={parsed.value.height ?? 360}
          />
        {:else if parsed.value.type === "svg"}
          <SvgRenderer
            code={parsed.value.code}
            title={parsed.value.title}
            caption={parsed.value.caption}
          />
        {:else if parsed.value.type === "mermaid"}
          <MermaidRenderer
            code={parsed.value.code}
            title={parsed.value.title}
            caption={parsed.value.caption}
          />
        {:else if parsed.value.type === "widget"}
          <VisualFrame
            code={parsed.value.code}
            title={parsed.value.title}
            {streaming}
            width={parsed.value.width ?? 800}
            height={parsed.value.height ?? 500}
          />
        {/if}
      {:else}
        <p class="text-xs text-muted-foreground">{parsed.message}</p>
      {/if}
    </CardContent>
  </Card>
</div>
