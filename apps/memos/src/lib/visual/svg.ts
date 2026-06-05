import { z } from "zod";

export const renderSvgSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(80)
    .describe("Short visual title. Use sentence case, not a filename."),
  code: z
    .string()
    .min(1)
    .max(40_000)
    .describe(
      "Raw SVG markup starting with <svg>. " +
        "Do not include HTML wrappers, DOCTYPE, <html>, <head>, or <body> tags. " +
        "Use the pre-built CSS classes: c-blue, c-teal, c-amber, c-green, c-red, c-purple, c-coral, c-pink, c-gray. " +
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

export type SvgSpec = z.infer<typeof renderSvgSchema>;
