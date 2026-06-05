<script lang="ts">
  import DOMPurify from "dompurify";

  interface Props {
    code: string;
    title: string;
    caption?: string;
    class?: string;
  }

  let { code, title, caption, class: extraClass = "" }: Props = $props();

  function sanitizeSvg(svgCode: string) {
    return DOMPurify.sanitize(svgCode, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: [
        "script",
        "foreignObject",
        "iframe",
        "object",
        "embed",
        "canvas",
        "audio",
        "video",
      ],
      FORBID_ATTR: [
        "style",
        "onload",
        "onclick",
        "onerror",
        "onmouseover",
        "onmouseenter",
        "onmousemove",
      ],
    });
  }

  function svgContent(): string | null {
    return sanitizeSvg(code);
  }
</script>

<div class={extraClass}>
  <div
    class="svg-host [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
    role="img"
    aria-label={title}
  >
    {@html svgContent()}
  </div>
  {#if caption}
    <p class="text-xs text-muted-foreground mt-2">{caption}</p>
  {/if}
</div>

<style>
  .svg-host {
    --svg-primary: var(--color-foreground);
    --svg-secondary: var(--color-muted-foreground);
    --svg-tertiary: color-mix(in srgb, var(--color-muted-foreground) 68%, transparent);
    --svg-surface: var(--color-muted);
    --svg-border: var(--color-border-strong);
    --svg-blue-fill: color-mix(in srgb, var(--color-accent) 16%, var(--color-background));
    --svg-blue-stroke: var(--color-accent);
    --svg-purple-fill: color-mix(in srgb, var(--color-accent) 22%, var(--color-background));
    --svg-purple-stroke: color-mix(in srgb, var(--color-accent) 88%, var(--color-foreground));
    --svg-coral-fill: color-mix(in srgb, var(--color-warning) 11%, var(--color-background));
    --svg-coral-stroke: color-mix(in srgb, var(--color-warning) 78%, var(--color-foreground));
    --svg-pink-fill: color-mix(in srgb, var(--color-error) 9%, var(--color-background));
    --svg-pink-stroke: color-mix(in srgb, var(--color-error) 72%, var(--color-foreground));
    --svg-teal-fill: color-mix(in srgb, var(--color-success) 14%, var(--color-background));
    --svg-teal-stroke: var(--color-success);
    --svg-green-fill: color-mix(in srgb, var(--color-success) 20%, var(--color-background));
    --svg-green-stroke: color-mix(in srgb, var(--color-success) 85%, var(--color-foreground));
    --svg-amber-fill: color-mix(in srgb, var(--color-warning) 16%, var(--color-background));
    --svg-amber-stroke: var(--color-warning);
    --svg-red-fill: color-mix(in srgb, var(--color-error) 14%, var(--color-background));
    --svg-red-stroke: var(--color-error);
    --svg-gray-fill: var(--color-muted);
    --svg-gray-stroke: var(--color-border-strong);
    min-height: 160px;
  }
  .svg-host :global(svg .t) {
    fill: var(--svg-primary);
    font-family: var(--font-sans);
    font-size: 14px;
  }
  .svg-host :global(svg .ts) {
    fill: var(--svg-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
  }
  .svg-host :global(svg .th) {
    fill: var(--svg-primary);
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 500;
  }
  .svg-host :global(svg .box) {
    fill: var(--svg-surface);
    stroke: var(--svg-border);
  }
  .svg-host :global(svg .arr) {
    fill: none;
    stroke: var(--svg-tertiary);
    stroke-width: 1.5;
  }
  .svg-host :global(svg .leader) {
    fill: none;
    stroke: var(--svg-tertiary);
    stroke-width: 0.5;
    stroke-dasharray: 4 3;
  }
  .svg-host :global(svg .node) {
    cursor: pointer;
  }
  .svg-host :global(svg .node:hover) {
    opacity: 0.82;
  }
  .svg-host :global(svg .c-blue > rect),
  .svg-host :global(svg .c-blue > circle),
  .svg-host :global(svg .c-blue > ellipse),
  .svg-host :global(svg rect.c-blue),
  .svg-host :global(svg circle.c-blue),
  .svg-host :global(svg ellipse.c-blue) {
    fill: var(--svg-blue-fill);
    stroke: var(--svg-blue-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-purple > rect),
  .svg-host :global(svg .c-purple > circle),
  .svg-host :global(svg .c-purple > ellipse),
  .svg-host :global(svg rect.c-purple),
  .svg-host :global(svg circle.c-purple),
  .svg-host :global(svg ellipse.c-purple) {
    fill: var(--svg-purple-fill);
    stroke: var(--svg-purple-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-coral > rect),
  .svg-host :global(svg .c-coral > circle),
  .svg-host :global(svg .c-coral > ellipse),
  .svg-host :global(svg rect.c-coral),
  .svg-host :global(svg circle.c-coral),
  .svg-host :global(svg ellipse.c-coral) {
    fill: var(--svg-coral-fill);
    stroke: var(--svg-coral-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-pink > rect),
  .svg-host :global(svg .c-pink > circle),
  .svg-host :global(svg .c-pink > ellipse),
  .svg-host :global(svg rect.c-pink),
  .svg-host :global(svg circle.c-pink),
  .svg-host :global(svg ellipse.c-pink) {
    fill: var(--svg-pink-fill);
    stroke: var(--svg-pink-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-teal > rect),
  .svg-host :global(svg .c-teal > circle),
  .svg-host :global(svg .c-teal > ellipse),
  .svg-host :global(svg rect.c-teal),
  .svg-host :global(svg circle.c-teal),
  .svg-host :global(svg ellipse.c-teal) {
    fill: var(--svg-teal-fill);
    stroke: var(--svg-teal-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-green > rect),
  .svg-host :global(svg .c-green > circle),
  .svg-host :global(svg .c-green > ellipse),
  .svg-host :global(svg rect.c-green),
  .svg-host :global(svg circle.c-green),
  .svg-host :global(svg ellipse.c-green) {
    fill: var(--svg-green-fill);
    stroke: var(--svg-green-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-amber > rect),
  .svg-host :global(svg .c-amber > circle),
  .svg-host :global(svg .c-amber > ellipse),
  .svg-host :global(svg rect.c-amber),
  .svg-host :global(svg circle.c-amber),
  .svg-host :global(svg ellipse.c-amber) {
    fill: var(--svg-amber-fill);
    stroke: var(--svg-amber-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-red > rect),
  .svg-host :global(svg .c-red > circle),
  .svg-host :global(svg .c-red > ellipse),
  .svg-host :global(svg rect.c-red),
  .svg-host :global(svg circle.c-red),
  .svg-host :global(svg ellipse.c-red) {
    fill: var(--svg-red-fill);
    stroke: var(--svg-red-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-gray > rect),
  .svg-host :global(svg .c-gray > circle),
  .svg-host :global(svg .c-gray > ellipse),
  .svg-host :global(svg rect.c-gray),
  .svg-host :global(svg circle.c-gray),
  .svg-host :global(svg ellipse.c-gray) {
    fill: var(--svg-gray-fill);
    stroke: var(--svg-gray-stroke);
    stroke-width: 1px;
  }
  .svg-host :global(svg .c-blue > .t),
  .svg-host :global(svg .c-blue > .th),
  .svg-host :global(svg .c-purple > .t),
  .svg-host :global(svg .c-purple > .th),
  .svg-host :global(svg .c-coral > .t),
  .svg-host :global(svg .c-coral > .th),
  .svg-host :global(svg .c-pink > .t),
  .svg-host :global(svg .c-pink > .th),
  .svg-host :global(svg .c-teal > .t),
  .svg-host :global(svg .c-teal > .th),
  .svg-host :global(svg .c-green > .t),
  .svg-host :global(svg .c-green > .th),
  .svg-host :global(svg .c-amber > .t),
  .svg-host :global(svg .c-amber > .th),
  .svg-host :global(svg .c-red > .t),
  .svg-host :global(svg .c-red > .th),
  .svg-host :global(svg .c-gray > .t),
  .svg-host :global(svg .c-gray > .th) {
    fill: var(--svg-primary);
  }
  .svg-host :global(svg .c-blue > .ts),
  .svg-host :global(svg .c-purple > .ts),
  .svg-host :global(svg .c-coral > .ts),
  .svg-host :global(svg .c-pink > .ts),
  .svg-host :global(svg .c-teal > .ts),
  .svg-host :global(svg .c-green > .ts),
  .svg-host :global(svg .c-amber > .ts),
  .svg-host :global(svg .c-red > .ts),
  .svg-host :global(svg .c-gray > .ts) {
    fill: var(--svg-secondary);
  }
</style>
