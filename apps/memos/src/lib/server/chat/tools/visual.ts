import { tool } from "ai";
import { renderChartSchema } from "$lib/visual/chart";
import { renderSvgSchema } from "$lib/visual/svg";
import { renderWidgetSchema } from "$lib/visual/widget";

export function createVisualTools() {
  return {
    render_chart: tool({
      description:
        "Render a chart from HTML code. Use for any data visualization: bar charts, line charts, pie charts, scatter plots, heatmaps, etc. " +
        "Provide an HTML fragment: <style> (short) → chart container (<canvas>/<div>/<svg>) → <script> last. No DOCTYPE/<html>/<head>/<body>.",
      inputSchema: renderChartSchema,
      execute: async (spec) => spec,
    }),

    render_svg: tool({
      description:
        "Show static visual content — SVG diagrams, flowcharts, structural diagrams, architecture diagrams, ERDs (via Mermaid), concept diagrams, or illustrations — inline in the chat UI. " +
        "Use for visual content that does not need dynamic JavaScript. " +
        "For SVG: provide raw SVG starting with <svg>. Use the pre-built CSS classes: " +
        "color ramps (c-blue, c-teal, c-amber, c-green, c-red, c-purple, c-coral, c-pink, c-gray), " +
        "text classes (t, ts, th), container classes (box, node, arr, leader). " +
        "For Mermaid: provide Mermaid diagram source (ERDs, sequence diagrams, Gantt charts). " +
        "Do not include HTML wrappers, script tags, event handlers, iframes, or external resources.",
      inputSchema: renderSvgSchema,
      execute: async (spec) => spec,
    }),

    render_widget: tool({
      description:
        "Show interactive HTML content — calculators, dashboards, interactive explainers, games, UI mockups, or any content with user controls. " +
        "Provide an HTML fragment: <style> → content HTML → <script>. No DOCTYPE/<html>/<head>/<body>.",
      inputSchema: renderWidgetSchema,
      execute: async (spec) => spec,
    }),
  };
}
