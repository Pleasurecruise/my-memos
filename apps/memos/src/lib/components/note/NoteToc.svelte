<script lang="ts">
  import { onMount } from "svelte";
  import { cn } from "@my-memos/ui";
  import type { TocEntry } from "$lib/types";

  interface Props {
    entries: TocEntry[];
  }

  let { entries }: Props = $props();

  let activeId = $state<string>("");
  let phase = $state<"collapsed" | "expanded" | "revealed">("collapsed");
  let barWidths = $state(new Map<string, number>());
  let isClickScrolling = false;
  let phaseTimer: ReturnType<typeof setTimeout> | null = null;
  let observer: IntersectionObserver | null = null;
  let navElement = $state<HTMLElement | null>(null);
  let tocOffsetRem = $state(2.5);
  let tocLeftPx = $state(16);

  const TOP_DEAD_ZONE_PX = 64;
  const HEADER_MAX_OFFSET_REM = 2.5;
  const TOC_GAP_PX = 32;
  const TOC_MAX_WIDTH_PX = 160;

  function updateTocOffset() {
    const note = document.getElementById("note");
    if (!note) return;
    const noteTop = note.getBoundingClientRect().top;
    const headerRef = Math.max(1, note.offsetTop);
    const progress = Math.max(0, Math.min(1, noteTop / headerRef));
    tocOffsetRem = progress * HEADER_MAX_OFFSET_REM;
  }

  function updateHorizontalPosition() {
    const note = document.getElementById("note");
    if (!note) return;
    const noteRect = note.getBoundingClientRect();
    tocLeftPx = Math.max(16, noteRect.left - TOC_MAX_WIDTH_PX - TOC_GAP_PX);
  }

  function uniformWidths(): Map<string, number> {
    const widths = new Map<string, number>();
    for (const entry of entries) {
      widths.set(entry.id, 28);
    }
    return widths;
  }

  function getCanvasFont(style: CSSStyleDeclaration): string {
    const stretch =
      style.fontStretch === "normal" || style.fontStretch === "100%" ? "" : style.fontStretch;
    return [
      style.fontStyle,
      style.fontVariant,
      style.fontWeight,
      stretch,
      style.fontSize,
      style.fontFamily,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function measureTextWidth(text: string, font: string): number {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 28;
    ctx.font = font;
    return ctx.measureText(text).width;
  }

  function normalizeBarWidths(widths: Map<string, number>): Map<string, number> {
    const values = [...widths.values()];
    if (values.length === 0) return widths;

    const minWidth = Math.min(...values);
    const maxWidth = Math.max(...values);
    const normalized = new Map<string, number>();

    for (const [id, width] of widths) {
      if (maxWidth - minWidth < 1) {
        normalized.set(id, 38);
        continue;
      }
      const ratio = (width - minWidth) / (maxWidth - minWidth);
      normalized.set(id, Math.round(20 + ratio * 36));
    }

    return normalized;
  }

  function estimateTextWidths(): Map<string, number> {
    const widths = new Map<string, number>();
    for (const entry of entries) {
      widths.set(entry.id, entry.text.length * 8);
    }
    return widths;
  }

  function measureBarWidths() {
    const sample = navElement?.querySelector(".toc__text");
    if (!(sample instanceof HTMLElement)) {
      barWidths = normalizeBarWidths(estimateTextWidths());
      return;
    }

    const font = getCanvasFont(getComputedStyle(sample));
    const measured = new Map<string, number>();
    for (const entry of entries) {
      measured.set(entry.id, measureTextWidth(entry.text, font));
    }
    barWidths = normalizeBarWidths(measured);
  }

  function handleEnter() {
    if (phaseTimer) clearTimeout(phaseTimer);
    phase = "expanded";
    phaseTimer = setTimeout(() => {
      phase = "revealed";
    }, 180);
  }

  function handleLeave() {
    if (phaseTimer) clearTimeout(phaseTimer);
    phase = "collapsed";
  }

  onMount(() => {
    barWidths = uniformWidths();
    measureBarWidths();
    document.fonts?.ready.then(measureBarWidths);

    const onResize = () => {
      measureBarWidths();
      updateHorizontalPosition();
    };

    const onScroll = () => {
      updateTocOffset();
      if (isClickScrolling) return;
      if (window.scrollY <= TOP_DEAD_ZONE_PX) activeId = "";
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    updateTocOffset();
    updateHorizontalPosition();

    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter(Boolean) as HTMLElement[];

    if (headings.length > 0) {
      observer = new IntersectionObserver(
        (items) => {
          if (isClickScrolling || window.scrollY <= TOP_DEAD_ZONE_PX) return;
          for (const item of items) {
            if (item.isIntersecting) {
              activeId = item.target.id;
              break;
            }
          }
        },
        { rootMargin: "0px 0px -70% 0px", threshold: 0 },
      );

      for (const h of headings) observer.observe(h);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      if (phaseTimer) clearTimeout(phaseTimer);
    };
  });

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    isClickScrolling = true;
    activeId = id;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);

    const onEnd = () => {
      isClickScrolling = false;
    };

    if ("onscrollend" in window) {
      window.addEventListener("scrollend", onEnd, { once: true });
    } else {
      setTimeout(onEnd, 600);
    }
  }

  const showText = $derived(phase === "revealed");
</script>

{#if entries.length > 0}
  <nav
    bind:this={navElement}
    aria-label="Table of contents"
    onmouseenter={handleEnter}
    onmouseleave={handleLeave}
    class="hidden xl:fixed xl:top-[calc(50%+var(--toc-offset,0))] xl:z-20 xl:block xl:max-h-[calc(100vh-16rem)] xl:max-w-40 xl:-translate-y-1/2 xl:overflow-y-auto"
    style:left={`${tocLeftPx}px`}
    style:--toc-offset={`${tocOffsetRem}rem`}
  >
    <ul class={cn("flex flex-col transition-[gap] duration-200", showText ? "gap-2" : "gap-1.5")}>
      {#each entries as entry}
        {@const isActive = activeId === entry.id}
        {@const indent = Math.max(0, entry.depth - 2) * 10}
        {@const width = barWidths.get(entry.id) ?? 24}
        <li class="relative">
          {#if isActive && showText}
            <div class="absolute top-0.75 left-0 h-3 w-0.5 rounded-full bg-foreground"></div>
          {/if}
          <a
            href="#{entry.id}"
            title={entry.text}
            onclick={(e) => {
              e.preventDefault();
              scrollTo(entry.id);
            }}
            class={cn(
              "toc__link relative block text-muted-foreground transition-colors",
              isActive && "text-foreground",
            )}
            style:--toc-indent={`${indent + 8}px`}
            style:--toc-bar-width={`${width}px`}
          >
            <span
              class={cn(
                "block rounded-full bg-current transition-all duration-200",
                showText ? "h-0 w-0 opacity-0" : "h-1 w-(--toc-bar-width)",
                !showText && (isActive ? "opacity-90" : "opacity-20"),
              )}
              style:margin-left={`${indent + 8}px`}
            ></span>
            <span
              class={cn(
                "toc__text block overflow-hidden truncate pl-(--toc-indent) text-[11px] leading-snug transition-all duration-150",
                showText ? "h-auto opacity-100" : "h-0 opacity-0",
                isActive && showText && "font-medium",
              )}
            >
              {entry.text}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
