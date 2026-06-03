import { z } from "zod";

export const renderWidgetSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(80)
    .describe(
      "Short snake_case identifier for this widget. Used as accessible label. Use sentence case for display — underscores become spaces in the title.",
    ),
  code: z
    .string()
    .min(1)
    .max(60_000)
    .describe(
      "HTML fragment to render. Structure: <style> (short) → content HTML → <script> last. " +
        "No DOCTYPE, <html>, <head>, or <body>. " +
        "Scripts execute after streaming completes. Load libraries from CDN: cdnjs.cloudflare.com, esm.sh, cdn.jsdelivr.net, unpkg.com. " +
        "CSS custom properties are pre-defined: --color-text-primary (#e0e0e0), --color-background-primary (#1a1a1a), --color-border-tertiary, --font-sans, --border-radius-md, etc.",
    ),
  width: z
    .number()
    .int()
    .min(200)
    .max(1200)
    .optional()
    .describe("Container width in pixels. Default: 800."),
  height: z
    .number()
    .int()
    .min(100)
    .max(2000)
    .optional()
    .describe("Container height in pixels. Default: 500. Auto-resizes if content is taller."),
});

export const partialRenderWidgetSchema = renderWidgetSchema.partial();

export type RenderWidgetSpec = z.infer<typeof renderWidgetSchema>;
export type PartialRenderWidgetSpec = z.infer<typeof partialRenderWidgetSchema>;
export type RenderWidgetPayload = RenderWidgetSpec | PartialRenderWidgetSpec | null;

export function parseRenderWidgetPayload(value: object | null) {
  if (value === null) return null;

  const result = partialRenderWidgetSchema.safeParse(value);
  return result.success ? result.data : null;
}
