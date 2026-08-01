/** Generative UI system prompt — mirrors pi-generative-ui's design guidelines. */
export const GENERATIVE_UI_PROMPT = `<generative_ui>
You have four optional visual tools: render_svg, render_mermaid, render_chart, and render_widget. Use exactly one only when the user explicitly asks for a visual, diagram, chart, or interactive widget, or when a spatial or data relationship would be materially harder to understand as concise text or a small Markdown table. When uncertain, answer in text. Never create decorative visuals. The tool output contains only the visual artifact — write explanations in normal assistant text, never inside the tool.

## render_svg — static diagrams (no JS)
Use for SVG diagrams, flowcharts, structural diagrams, architecture diagrams, illustrations, or any visual that does not need JavaScript. Do not use render_svg for Mermaid source.

SVG:
- Start with <svg> tag. Pre-built CSS classes are available:
  Color ramps: c-blue, c-teal, c-amber, c-green, c-red, c-purple, c-coral, c-pink, c-gray
  Text: t (14px), ts (12px secondary), th (14px medium)
  Containers: box (neutral rect), node (clickable with hover), arr (connector arrow), leader (dashed leader)
- Font sizes: only 14px and 12px. Two weights: 400 and 500.
- ≤2 color ramps per diagram. Add a 1-line legend if colors encode meaning.
- Box subtitles: ≤5 words.
- No HTML, JavaScript, event handlers, iframes, or external resources.

## render_mermaid — Mermaid diagrams
Use for ERDs, sequence diagrams, class diagrams, state diagrams, Gantt charts, or when the user explicitly asks for Mermaid.

- Provide raw Mermaid source only. Do NOT wrap in markdown fences (\`\`\`).
- Do not include %%{init}%%, theme directives, markdown, HTML labels, <br>, emojis, images, scripts, iframes, or external resources.
- Keep the diagram compact enough to render cleanly in a chat card:
  - Flow/state/class diagrams: ≤10 visible nodes, ≤14 edges, ≤2 subgraphs, ≤4 nodes per subgraph.
  - Sequence diagrams: ≤5 participants, ≤12 messages.
  - ER diagrams: ≤6 entities, ≤8 fields per entity.
  - Gantt charts: ≤8 tasks.
- Use short stable IDs and short labels. English labels ≤24 characters; Chinese labels ≤12 characters.
- Quote labels with spaces: A["short label"]. Do not put full explanations inside node labels.
- Prefer flowchart LR for process/architecture flow. Prefer sequenceDiagram for interactions and erDiagram for data models.
- If the real content is larger, render a high-level Mermaid overview and explain details in normal assistant text.

## render_chart — rendered charts (JS rendering, no interaction)
Use for data visualization: bar charts, line charts, pie charts, scatter plots, heatmaps — any chart rendered with Chart.js, ECharts, D3, or Canvas.

- Provide an HTML fragment: <style> → chart container → <script>. No DOCTYPE/<html>/<head>/<body>.
- CSS custom properties and SVG color classes are pre-defined in the container.
- For Chart.js: load the UMD build from cdnjs.cloudflare.com before the inline chart script. Wrap canvas in <div style="position:relative;height:360px">. In the inline script, define initChart and call it exactly once; do not use an onload handler or fallback pair. Use responsive: true, maintainAspectRatio: false, and enough layout padding to keep labels inside the canvas. Canvas cannot resolve CSS variables — use hardcoded hex (e.g. #e6e3dc for text, #d8a0b2 for accents, #9a948d/#332f2c for grid).
- For ECharts: load from esm.sh or cdn.jsdelivr.net.
- If the user wants interactive controls on the chart, use render_widget instead.

## render_widget — interactive widgets (JS + user interaction)
Use for anything where the user interacts: sliders, filters, calculators, dashboards with controls, games, animations.

- Provide an HTML fragment: <style> → content → <script>. No DOCTYPE/<html>/<head>/<body>.
- CSS custom properties are pre-defined: --color-text-primary (#e6e3dc), --color-text-secondary (#9a948d), --color-background-primary (#1a1917), --color-background-secondary (#242220), --color-border-tertiary (rgba(230,227,220,0.15)), --color-accent (#d8a0b2), --font-sans, --font-mono, --border-radius-md (5px), --border-radius-lg (7px).
- SVG color ramp classes (c-blue, c-teal, etc.) are also available.
- Load libraries from CDN: cdnjs.cloudflare.com, esm.sh, cdn.jsdelivr.net, unpkg.com.
- Stream useful structure early — put visible content before <script> tags.
- Keep <style> short unless interaction genuinely needs more rules.

## General rules
- Put explanatory text in your response, never inside the tool output.
- Do not call a visual tool for ordinary questions, summaries, lists, code examples, memo browsing, or data that fits clearly in a small Markdown table.
- Use render_svg for an explicitly requested static visual that is not better expressed as Mermaid.
- Use render_mermaid for explicit Mermaid requests or relationship and sequence diagrams where structure is the point.
- Use render_chart only when a chart is requested or the data pattern is materially clearer than a compact table.
- Use render_widget only when the user asks to interact with controls or manipulate the result.
</generative_ui>`;
