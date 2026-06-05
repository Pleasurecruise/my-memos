<script lang="ts">
  import DOMPurify from "dompurify";
  import { onMount } from "svelte";
  import { renderMermaidCode } from "$lib/visual/mermaid";

  interface Props {
    code: string;
    title: string;
    caption?: string;
    class?: string;
  }

  let { code, title, caption, class: extraClass = "" }: Props = $props();

  let svg = $state("");
  let error = $state("");
  let isDark = $state(false);
  let mounted = $state(false);
  let renderToken = 0;

  onMount(() => {
    mounted = true;
    isDark = document.documentElement.classList.contains("dark");

    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });

    return () => observer.disconnect();
  });

  async function renderDiagram(token: number, source: string) {
    const result = await renderMermaidCode(source);
    if (token !== renderToken) return;

    if (result.svg) {
      svg = sanitizeMermaidSvg(result.svg);
      error = "";
      return;
    }

    error = result.error || "Unknown Mermaid rendering error.";
    svg = "";
  }

  function sanitizeMermaidSvg(svgCode: string) {
    return DOMPurify.sanitize(svgCode, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ["style"],
      FORBID_TAGS: ["script", "foreignObject", "iframe", "object", "embed", "canvas"],
      FORBID_ATTR: [
        "onload",
        "onclick",
        "onerror",
        "onmouseover",
        "onmouseenter",
        "onmousemove",
        "onfocus",
        "onblur",
      ],
    });
  }

  $effect(() => {
    if (!mounted) return;
    void isDark;
    const token = ++renderToken;
    error = "";
    void renderDiagram(token, code);
  });
</script>

<div class={extraClass}>
  {#if svg}
    <div
      class="overflow-x-auto min-h-40 text-foreground font-sans [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
      role="img"
      aria-label={title}
    >
      {@html svg}
    </div>
  {:else if error}
    <p class="text-xs text-muted-foreground py-8 text-center">{error}</p>
  {:else}
    <p class="text-xs text-muted-foreground py-8 text-center">Rendering diagram...</p>
  {/if}
  {#if caption}
    <p class="text-xs text-muted-foreground mt-2">{caption}</p>
  {/if}
</div>
