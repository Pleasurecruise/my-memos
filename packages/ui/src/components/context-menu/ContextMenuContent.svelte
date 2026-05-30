<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { scale } from "svelte/transition";
  import { cn } from "../../lib/utils";
  import type { ContextMenuContext } from "./ContextMenu.svelte";

  export interface ContextMenuContentProps extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: ContextMenuContentProps = $props();

  const ctx = getContext<ContextMenuContext>("context-menu");

  let el: HTMLDivElement | undefined = $state();

  const x = $derived(ctx.x);
  const y = $derived(ctx.y);

  const menuStyle = $derived.by(() => {
    if (!el) return `left:${x}px;top:${y}px`;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;

    if (x + rect.width > vw) left = Math.max(0, vw - rect.width - 8);
    if (y + rect.height > vh) top = Math.max(0, vh - rect.height - 8);
    if (left < 0) left = 8;

    return `left:${left}px;top:${top}px`;
  });

  $effect(() => {
    if (!ctx.open) return;

    const frame = requestAnimationFrame(() => {
      const firstItem = el?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
      firstItem?.focus();
    });

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        ctx.close();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const menuItems = Array.from(
          el?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
        );
        const activeIndex = menuItems.indexOf(document.activeElement as HTMLElement);
        const next =
          e.key === "ArrowDown"
            ? menuItems[(activeIndex + 1) % menuItems.length]
            : menuItems[(activeIndex - 1 + menuItems.length) % menuItems.length];
        next?.focus();
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (!el?.contains(e.target as Node)) ctx.close();
    }

    document.addEventListener("keydown", onKeydown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  });
</script>

{#if ctx.open}
  <div
    bind:this={el}
    role="menu"
    data-slot="content"
    aria-orientation="vertical"
    class={cn(
      "fixed z-50 rounded-lg border border-border bg-background shadow-md",
      "min-w-40 p-1 focus:outline-none",
      extraClass,
    )}
    style={menuStyle}
    transition:scale={{ start: 0.96, opacity: 0, duration: 130 }}
    {...rest}
  >
    {@render children?.()}
  </div>
{/if}
