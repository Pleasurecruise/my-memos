<script module lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export type DropdownMenuAlign = "start" | "center" | "end";

  export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
    align?: DropdownMenuAlign;
    children?: Snippet;
  }
</script>

<script lang="ts">
  import { getContext } from "svelte";
  import { scale } from "svelte/transition";
  import { cn } from "../../lib/utils";
  import type { DropdownMenuContext } from "./DropdownMenu.svelte";

  let {
    align = "start",
    children,
    class: extraClass = "",
    ...rest
  }: DropdownMenuContentProps = $props();

  const ctx = getContext<DropdownMenuContext>("dropdown-menu");

  let el: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!ctx.open) return;

    const frame = requestAnimationFrame(() => {
      const first = el?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
      first?.focus();
    });

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        ctx.close();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(
          el?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
        );
        const idx = items.indexOf(document.activeElement as HTMLElement);
        const next =
          e.key === "ArrowDown"
            ? items[(idx + 1) % items.length]
            : items[(idx - 1 + items.length) % items.length];
        next?.focus();
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (!ctx.wrapper?.contains(e.target as Node)) ctx.close();
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
    aria-orientation="vertical"
    class={cn(
      "absolute top-full z-50 mt-1 rounded-lg border border-border bg-background shadow-md",
      "min-w-40 p-1 focus:outline-none",
      align === "start" && "left-0",
      align === "center" && "left-1/2 -translate-x-1/2",
      align === "end" && "right-0",
      extraClass,
    )}
    transition:scale={{ start: 0.96, opacity: 0, duration: 130 }}
    {...rest}
  >
    {@render children?.()}
  </div>
{/if}
