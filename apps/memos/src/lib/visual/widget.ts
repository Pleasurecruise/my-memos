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
        "CSS custom properties are pre-defined in the rendering context: --color-text-primary (#e6e3dc), --color-background-primary (#1a1917), --color-text-secondary, --color-background-secondary, --color-border-primary, --color-border-secondary, --color-border-tertiary, --font-sans, --border-radius-md, --border-radius-lg, etc. Dark mode only — all colors are warm charcoal.",
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

export type WidgetSpec = z.infer<typeof renderWidgetSchema>;
