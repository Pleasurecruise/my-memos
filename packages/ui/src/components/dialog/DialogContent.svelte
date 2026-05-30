<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";
  import { getContext } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { cn } from "../../lib/utils";
  import type { DialogContext } from "./Dialog.svelte";

  export interface DialogContentProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
    children?: Snippet;
  }

  let { children, class: extraClass = "", ...rest }: DialogContentProps = $props();

  const ctx = getContext<DialogContext>("dialog");

  $effect(() => {
    if (!ctx.open) return;

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") ctx.close();
    }

    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  });
</script>

{#if ctx.open}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-black/40"
    role="presentation"
    onclick={() => ctx.close()}
    transition:fade={{ duration: 150 }}
  ></div>

  <!-- Panel -->
  <div
    data-slot="content"
    class={cn(
      "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
      "bg-background border border-border rounded-xl shadow-lg",
      "p-6 focus:outline-none",
      extraClass,
    )}
    role="dialog"
    aria-modal="true"
    transition:scale={{ start: 0.96, opacity: 0, duration: 150 }}
    {...rest}
  >
    {@render children?.()}
  </div>
{/if}
