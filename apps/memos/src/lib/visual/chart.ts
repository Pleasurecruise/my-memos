import { z } from "zod";

export const chartSpecSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(80)
    .describe("Short chart title in sentence case. Used as the accessible label."),
  code: z
    .string()
    .min(1)
    .max(60_000)
    .describe(
      "HTML fragment containing the chart. Structure: <style> (short) → chart container (<canvas>/<div>/<svg>) → <script> last. " +
        "Load libraries via CDN (cdnjs.cloudflare.com, esm.sh, cdn.jsdelivr.net, unpkg.com). " +
        "Supported libraries: Chart.js, ECharts, D3, Canvas, or any CDN-hosted library. " +
        "For Chart.js: wrap <canvas> in a <div> with explicit height. Load UMD build, use onload+fallback pattern. " +
        "No DOCTYPE, <html>, <head>, or <body>. Keep style block under ~15 lines.",
    ),
  width: z.number().int().min(200).max(1200).optional().describe("Width in pixels. Default: 720."),
  height: z
    .number()
    .int()
    .min(100)
    .max(2000)
    .optional()
    .describe("Height in pixels. Default: 360."),
});

export type ChartSpec = z.infer<typeof chartSpecSchema>;

export const renderChartSchema = chartSpecSchema;
export const partialRenderChartSchema = chartSpecSchema.partial();
export type RenderChartSpec = ChartSpec;
export type PartialRenderChartSpec = z.infer<typeof partialRenderChartSchema>;
export type RenderChartPayload = ChartSpec | PartialRenderChartSpec | null;

export function parseRenderChartPayload(value: object | null) {
  if (value === null) return null;
  const result = partialRenderChartSchema.safeParse(value);
  return result.success ? result.data : null;
}
