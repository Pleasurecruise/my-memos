import { z } from "zod";

export const staticVisualFormatSchema = z.enum(["svg", "mermaid"]);

export const renderSvgSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(80)
    .describe("Short visual title. Use sentence case, not a filename."),
  format: staticVisualFormatSchema.describe(
    "Visual format. Use 'svg' for diagrams, flowcharts, structural diagrams, and illustrations. " +
      "Use 'mermaid' for ERDs, class diagrams, sequence diagrams, and Gantt charts.",
  ),
  code: z
    .string()
    .min(1)
    .max(40_000)
    .describe(
      "The visual code. For SVG: raw SVG markup starting with <svg>. For Mermaid: Mermaid diagram source (ERDs, class diagrams, sequence diagrams, Gantt charts). " +
        'Do NOT wrap in markdown fences. Quote labels with spaces: A["label"]. ' +
        "Do not include HTML wrappers, DOCTYPE, <html>, <head>, or <body> tags. " +
        "For SVG, use the pre-built CSS classes: c-blue, c-teal, c-amber, c-green, c-red, c-purple, c-coral, c-pink, c-gray. " +
        "Text classes: t (14px), ts (12px secondary), th (14px medium). Container classes: box (neutral), node (clickable), arr (connector arrow).",
    ),
  caption: z
    .string()
    .max(240)
    .optional()
    .describe(
      "Optional one-sentence caption. Put explanatory prose in your normal assistant response — not here.",
    ),
});

export const partialRenderSvgSchema = renderSvgSchema.partial();

export type RenderSvgSpec = z.infer<typeof renderSvgSchema>;
export type PartialRenderSvgSpec = z.infer<typeof partialRenderSvgSchema>;
export type StaticVisualFormat = z.infer<typeof staticVisualFormatSchema>;
export type RenderSvgPayload = RenderSvgSpec | PartialRenderSvgSpec | null;

export function parseRenderSvgPayload(value: object | null) {
  if (value === null) return null;

  const result = partialRenderSvgSchema.safeParse(value);
  return result.success ? result.data : null;
}
